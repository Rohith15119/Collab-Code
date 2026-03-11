const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendResetEmail } = require("../services/EmailService");
const AuthService = require("../services/AuthService");

async function VerifyMySelf(req, res) {
  try {
    const user = AuthService.Identify(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function RegisterUser(req, res) {
  try {
    const { name, email, password } = req.body;

    const existingUser = AuthService.isExists(email);

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered ®️" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = AuthService.LoginUser(name, email, password);

    res
      .status(201)
      .json({ message: "User registered successfully", userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

async function LoginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = AuthService.ExistingUser(email);

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({ error: "Account not properly configured" });
    }

    if (user.provider && user.provider !== "local") {
      return res
        .status(400)
        .json({ error: "Please login with your social account" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(403).json({ error: "Invalid email or password" });
    }

    const accessToken = AuthService.DigitalSignature(user.id, user.email);

    res.status(200).json({
      message: "Login successful",
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

async function PasswordReset(req, res) {
  try {
    const hashedToken = AuthService.ResetToken(req);

    const user = AuthService.CheckUserToken(hashedToken);

    if (!user)
      return res.status(400).json({ error: "Invalid or expired token" });

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    AuthService.PasswordService(user, hashedPassword);

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
  }
}

async function PasswordResetRequest(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = AuthService.isExists(email);

    const responseMessage = "If an account exists, a reset link has been sent.";

    if (!user) {
      return res.status(200).json({ message: responseMessage });
    }

    AuthService.ResetToken(req);

    sendResetEmail(user.email, resetToken).catch((err) =>
      console.error("Email error:", err),
    );

    return res.status(200).json({ message: responseMessage });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function GoogleCallback(req, res) {
  try {
    const token = AuthService.DigitalSignature(req.user.id, req.user.email);

    res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`);
  } catch (err) {
    console.error("Google Auth Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  VerifyMySelf,
  LoginUser,
  RegisterUser,
  PasswordReset,
  PasswordResetRequest,
  GoogleCallback,
};
