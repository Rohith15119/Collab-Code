const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const User = require("../models/User");

router.patch("/user", authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await User.findByPk(userId);

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Invalid name" });
    }

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.provider === "google" && normalizedEmail !== user.email) {
      return res.status(400).json({
        message: "Profile update failed",
        error: "Google accounts cannot change their email address",
      });
    }

    if (normalizedEmail !== user.email) {
      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({
          message: "Profile update failed",
          error: "Email already in use by another account",
        });
      }
    }

    await user.update(
      {
        name: name.trim(),
        email: normalizedEmail,
      },
      { where: { id: userId } },
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
});

module.exports = router;
