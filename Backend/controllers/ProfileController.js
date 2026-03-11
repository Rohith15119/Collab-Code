const AuthService = require("../services/AuthService");
const ProfileService = require("../services/ProfileService");
const User = require("../models/User");

async function Profile(req, res) {
  try {
    ProfileService.UserName(req.body.name, req.user.id);

    return res.status(200).json({ success: true, message: "Profile updated" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function UpdateAccount(req, res) {
  try {
    const { name, email } = req.body;
    const id = req.user.id;
    const normalizedEmail = email?.trim().toLowerCase();

    const user = AuthService.Identify(id);

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
      const existingUser = AuthService.isExists(normalizedEmail);

      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({
          message: "Profile update failed",
          error: "Email already in use by another account",
        });
      }
    }

    await User.update(
      {
        name: name.trim(),
        email: normalizedEmail,
      },
      { where: { id: id } },
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
}

async function DeleteAccountDetails(req, res) {
  try {
    const userId = req.user.id;

    if (!userId)
      return res.status(400).json({ message: "Invalid User Account" });

    ProfileService.Delete(userId);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function LogoutAccount(req, res) {
  res.status(200).json({ success: true });
}

module.exports = {
  Profile,
  DeleteAccountDetails,
  LogoutAccount,
  UpdateAccount,
};
