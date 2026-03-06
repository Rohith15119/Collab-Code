const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const authenticate = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");
const Redis = require("ioredis");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: { error: "Too many requests" },
});

router.use(limiter);

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on("error", (err) => console.error("Redis Error: ", err));

async function getCached(ownerId) {
  try {
    const data = await redis.get(`sessions:${ownerId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

async function setCache(ownerId, data) {
  try {
    await redis.set(`sessions:${ownerId}`, JSON.stringify(data), "PX", 15_000);
  } catch {
    // silent fail
  }
}

async function invalidateCache(ownerId) {
  try {
    await redis.del(`sessions:${ownerId}`);
  } catch {
    //keep silent
  }
}

router.post("/create-session", authenticate, async (req, res) => {
  try {
    const { title, language } = req.body;

    const session = await Session.create({
      roomId: uuidv4(),
      title: title || "Untitled Session",
      language: language,
      code: `// JavaScript Template\nfunction main() {\n  console.log("Hello, World!");\n}\nmain();\n`,
      ownerId: req.user.id,
    });

    await invalidateCache(req.user.id);

    res.status(201).json({ session });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/my", authenticate, async (req, res) => {
  try {
    res.set("Cache-Control", "private, max-age=15, stale-while-revalidate=30");

    const cached = await getCached(req.user.id);
    if (cached) {
      return res.status(200).json({
        success: true,
        count: cached.length,
        sessions: cached,
      });
    }

    const sessions = await Session.find({ ownerId: req.user.id })
      .select("title language roomId updatedAt createdAt -_id")
      .sort({ updatedAt: -1 }) // Sort newest to oldest
      .lean(); // Skips Mongoose object hydration (Crucial for speed)

    setCache(req.user.id, sessions);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (err) {
    console.error("MY SESSIONS ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:roomId", authenticate, async (req, res) => {
  try {
    const session = await Session.findOne({ roomId: req.params.roomId })
      // FIX: Added ownerId, sharedWith, and code to the selection
      .select(
        "title language code codeSnippet createdAt ownerId sharedWith -_id",
      )
      .lean();

    if (!session) return res.status(404).json({ error: "Session not found" });

    // FIX: Added optional chaining (?.) just in case sharedWith is null/undefined in old DB records
    const canAccess =
      session.ownerId === req.user.id ||
      session.sharedWith?.includes(req.user.id);

    if (!canAccess) return res.status(403).json({ error: "Access Denied" });

    res.status(200).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:roomId", authenticate, async (req, res) => {
  try {
    const { code, language, title, fontSize } = req.body;

    const $set = {};
    if (code !== undefined) $set.code = code;
    if (language !== undefined) $set.language = language;
    if (title !== undefined) $set.title = title;
    if (fontSize !== undefined) $set.fontSize = fontSize;

    if (Object.keys($set).length === 0)
      return res.status(400).json({ error: "No fields provided to update" });

    const session = await Session.findOneAndUpdate(
      { roomId: req.params.roomId, ownerId: req.user.id },
      { $set },
      { returnDocument: "after", lean: true },
    );

    if (!session) return res.status(404).json({ error: "Session not found" });

    await invalidateCache(req.user.id);

    res.status(200).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:roomId", authenticate, async (req, res) => {
  try {
    const deleted = await Session.findOneAndDelete({
      roomId: req.params.roomId,
      ownerId: req.user.id,
    }).lean();

    if (!deleted) return res.status(404).json({ error: "Session not found" });

    await invalidateCache(req.user.id);

    res.status(200).json({ success: true, message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
