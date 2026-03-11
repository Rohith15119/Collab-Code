const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { loginLimiter } = require("../services/Limiter");
const session = require("../controllers/SessionController");

router.post(
  "/create-session",
  authenticate,
  loginLimiter(60_000, 30, "Too many requests", true),
  session.CreateSession,
);

router.get("/my", authenticate, session.UserSessions);

router.get("/:roomId", authenticate, session.FetchSession);

router.put("/:roomId", authenticate, session.EditSession);

router.delete("/:roomId", authenticate, session.DeleteSession);

module.exports = router;
