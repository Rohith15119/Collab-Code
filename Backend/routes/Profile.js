const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const ProfileControl = require("../controllers/ProfileController");

router.patch("/user", authenticate, ProfileControl.UpdateAccount);

module.exports = router;
