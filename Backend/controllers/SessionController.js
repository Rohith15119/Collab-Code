const Session = require("../models/Session");
const RedisStore = require("../controllers/RedisController");
const SessionService = require("../services/SessionService");

async function CreateSession(req, res) {
  try {
    const { title, language } = req.body;

    const session = await SessionService.NewSession(
      title,
      language,
      req.user.id,
    );

    await RedisStore.invalidateCache(req.user.id);

    return res.status(201).json({ session });
  } catch (err) {
    console.error("Error creating session:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function UserSessions(req, res) {
  try {
    res.set("Cache-Control", "private, no-cache");

    const limitParam = parseInt(req.query.limit, 10);
    const limit = limitParam > 0 ? limitParam : 0;

    const cacheKey = `${req.user.id}:limit:${limit}`;

    const cached = await RedisStore.getCached(cacheKey);

    if (cached) {
      return res
        .status(200)
        .json({ success: true, count: cached.length, sessions: cached });
    }

    const query = await SessionService.SortedSessions(req.user.id, limit);

    const sessions = query;

    await RedisStore.setCache(cacheKey, sessions);

    return res
      .status(200)
      .json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    console.error("MY SESSIONS ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function FetchSession(req, res) {
  try {
    const session = await SessionService.Get_Session(req.params.roomId);

    if (!session) return res.status(404).json({ error: "Session not found" });

    const canAccess =
      session.ownerId.toString() === req.user.id ||
      session.sharedWith?.includes(req.user.id);

    const isShared = session.sharedWith?.includes(req.user.id);

    if (!canAccess && !isShared)
      return res.status(403).json({ error: "Access Denied" });

    return res.status(200).json({ success: true, session });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function EditSession(req, res) {
  try {
    const { code, language, title, fontSize } = req.body;

    const session_find = await SessionService.Get_Session(req.params.roomId);

    if (!session_find)
      return res.status(400).json({ error: "Session not found " });

    const isOwner = req.user.id === session_find.ownerId;
    const isShared = session.sharedWith?.includes(req.user.id);

    if (!isOwner && !isShared)
      return res.status(400).json({ error: "Access Denied" });

    const $set = {};
    if (code !== undefined) $set.code = code;
    if (language !== undefined) $set.language = language;
    if (title !== undefined) $set.title = title;
    if (fontSize !== undefined) $set.fontSize = fontSize;

    if (Object.keys($set).length === 0)
      return res.status(400).json({ error: "No fields provided to update" });

    const session = await SessionService.UpdateSession(
      req.params.roomId,
      req.user.id,
      $set,
    );

    await RedisStore.invalidateCache(req.user.id);

    return res.status(200).json({ success: true, session });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function DeleteSession(req, res) {
  try {
    const deleted = await SessionService.deleteSession(
      req.params.roomId,
      req.user.id,
    );

    if (!deleted) return res.status(404).json({ error: "Session not found" });

    await RedisStore.invalidateCache(req.user.id);

    return res.status(200).json({ success: true, message: "Session deleted" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  CreateSession,
  UserSessions,
  FetchSession,
  EditSession,
  DeleteSession,
};
