const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const authenticate = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");

router.post("/create-session", authenticate, async (req, res) => {
  try {
    const { title, language } = req.body;

    const session = await Session.create({
      roomId: uuidv4(),
      title: title || "Untitled Session",
      language: language,
      code: "// Start coding here...",
      ownerId: req.user.id,
    });

    res.status(201).json({ session });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/my", authenticate, async (req, res) => {
  try {
    const sessions = await Session.find({ ownerId: req.user.id }).sort({
      updatedAt: -1,
    });

    if (!sessions.length)
      return res.status(200).json({ success: true, sessions: [] });

    res.status(200).json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:roomId", async (req, res) => {
  try {
    const session = await Session.findOne({ roomId: req.params.roomId });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.status(200).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:roomId", authenticate, async (req, res) => {
  try {
    const { code, language, title, fontSize } = req.body;

    const session = await Session.findOneAndUpdate(
      { roomId: req.params.roomId, ownerId: req.user.id },
      { code, language, title, fontSize },
      { returnDocument: "after" },
    );

    if (!session) return res.status(404).json({ error: "Session not found" });
    res.status(200).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:roomId", authenticate, async (req, res) => {
  try {
    await Session.findOneAndDelete({
      roomId: req.params.roomId,
      ownerId: req.user.id,
    });
    res.status(200).json({ success: true, message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
