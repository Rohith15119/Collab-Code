const Session = require("../models/Session");
const User = require("../models/User");
const SharedService = require("../services/SharedViewService");

async function attachOwnerEmails(sessions) {
  const ownerIds = [...new Set(sessions.map((s) => s.ownerId))];
  const owners = await User.findAll({
    where: { id: ownerIds },
    attributes: ["id", "email", "name"],
  });
  const ownerMap = Object.fromEntries(owners.map((u) => [u.id, u]));

  return sessions.map((s) => {
    const owner = ownerMap[s.ownerId];
    return {
      ...s.toObject(),
      ownerEmail: owner?.email ?? null,
      ownerName: owner?.name ?? null,
    };
  });
}

async function attachSharedWithEmails(sessions) {
  const allIds = [...new Set(sessions.flatMap((s) => s.sharedWith ?? []))];
  if (allIds.length === 0) return sessions.map((s) => s.toObject());

  const users = await User.findAll({
    where: { id: allIds },
    attributes: ["id", "email"],
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.email]));

  return sessions.map((s) => ({
    ...s.toObject(),
    sharedWith: (s.sharedWith ?? []).map((id) => userMap[id] ?? id),
  }));
}

async function EditorialRequestsReceived(req, res) {
  try {
    const sessions = SharedService.SharedRequest(req.user.id);

    const withEmails = await attachOwnerEmails(sessions);

    return res.json({ sessions: withEmails });
  } catch (err) {
    console.error("GET /shared/received:", err);
    return res.status(500).json({ message: "Failed to fetch shared sessions" });
  }
}

async function EditorialRequestsSent(req, res) {
  try {
    const sessions = SharedService.Fetch_Requests(req.user.id);

    const withEmails = await attachSharedWithEmails(sessions);

    return res.json({ sessions: withEmails });
  } catch (err) {
    console.error("GET /shared/sent:", err);
    return res.status(500).json({ message: "Failed to fetch shared sessions" });
  }
}

async function AddSharedEditorials(req, res) {
  const { roomId } = req.params;
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  try {
    const session = SharedService.Fetch_Session_Share(req.params.roomId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can share this session" });
    }

    if (normalizedEmail === req.user.email?.toLowerCase()) {
      return res
        .status(400)
        .json({ message: "You cannot share a session with yourself" });
    }

    const targetUser = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (!targetUser) {
      return res
        .status(404)
        .json({ message: "No CodeFlash account found for that email" });
    }

    if (session.sharedWith.includes(targetUser.id)) {
      return res
        .status(409)
        .json({ message: "Session already shared with this user" });
    }

    await Session.updateOne(
      { roomId },
      { $addToSet: { sharedWith: targetUser.id } },
    );

    return res.json({
      message: `Session shared with ${normalizedEmail}`,
      sharedWithEmail: normalizedEmail,
    });
  } catch (err) {
    console.error("POST /:roomId/share:", err);
    return res.status(500).json({ message: "Failed to share session" });
  }
}

async function DeleteSharedEditorials(req, res) {
  const { roomId } = req.params;
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Verify session ownership
    const session = SharedService.Fetch_Session_Share(req.params.roomId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can revoke access" });
    }

    // 2. Look up the target user
    const targetUser = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = SharedService.Remove_Shared_Session(
      req.params.roomId,
      targetUser,
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "This user didn't have access" });
    }

    return res.json({ message: `Access revoked for ${normalizedEmail}` });
  } catch (err) {
    console.error("DELETE /:roomId/share:", err);
    return res.status(500).json({ message: "Failed to revoke access" });
  }
}

async function Collaborators(req, res) {
  const { roomId } = req.params;

  try {
    const session = SharedService.Fetch_Session_Share(req.params.roomId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can view collaborators" });
    }

    if (!session.sharedWith?.length) {
      return res.json({ collaborators: [] });
    }

    const users = await User.findAll({
      where: { id: session.sharedWith },
      attributes: ["id", "email", "name"],
    });

    return res.json({
      collaborators: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
      })),
    });
  } catch (err) {
    console.error("GET /:roomId/collaborators:", err);
    return res.status(500).json({ message: "Failed to fetch collaborators" });
  }
}

module.exports = {
  attachOwnerEmails,
  attachSharedWithEmails,
  EditorialRequestsReceived,
  EditorialRequestsSent,
  AddSharedEditorials,
  DeleteSharedEditorials,
  Collaborators,
};
