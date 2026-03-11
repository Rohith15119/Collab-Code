const express = require("express");
const { loginLimiter } = require("../services/Limiter");
const authenticate = require("../middleware/auth");
const SharedViewControl = require("../controllers/SharedViewController");

const router = express.Router();

router.get(
  "/shared/received",
  authenticate,
  loginLimiter(
    15 * 60 * 1000,
    30,
    "Too many share requests, please slow down.",
    false,
  ),
  SharedViewControl.EditorialRequestsReceived,
);

router.get(
  "/shared/sent",
  authenticate,
  loginLimiter(
    15 * 60 * 1000,
    30,
    "Too many share requests, please slow down.",
    false,
  ),
  SharedViewControl.EditorialRequestsSent,
);

router.post(
  "/:roomId/share",
  authenticate,
  loginLimiter(
    15 * 60 * 1000,
    30,
    "Too many share requests, please slow down.",
    false,
  ),
  SharedViewControl.AddSharedEditorials,
);

router.delete(
  "/:roomId/share",
  authenticate,
  loginLimiter(
    15 * 60 * 1000,
    30,
    "Too many share requests, please slow down.",
    false,
  ),
  SharedViewControl.DeleteSharedEditorials,
);

router.get(
  "/:roomId/collaborators",
  authenticate,
  loginLimiter(
    15 * 60 * 1000,
    30,
    "Too many share requests, please slow down.",
    false,
  ),
  SharedViewControl.Collaborators,
);

module.exports = router;
