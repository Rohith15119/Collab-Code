const express = require("express");
const User = require("../models/User");
const rateLimit = require("express-rate-limit");
const passport = require("../config/passport");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { sendResetEmail } = require("../services/EmailService");
const authenticate = require("../middleware/auth");

const {
  registerValidation,
  loginValidation,
  validate,
} = require("../validators/AuthValidator");

const app = express.Router();

app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Try again later." },
});

app.get("/me", authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  return res.json({ user });
});

app.post("/register", registerValidation, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered ®️" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
    });

    res
      .status(201)
      .json({ message: "User registered successfully", userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.post("/login", loginLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (user.provider !== "local")
      return res
        .status(400)
        .json({ error: "Please login with your social account" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const { accessToken } = await generateTokens(user);

    // Set cookie
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/reset-password/:token", async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user)
      return res.status(400).json({ error: "Invalid or expired token" });

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Something went wrong", message: error.message });
  }
});

app.post("/forgot-password-request", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });

    const responseMessage = "If an account exists, a reset link has been sent.";

    if (!user) {
      return res.status(200).json({ message: responseMessage });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await user.update({
      resetToken: hashedToken,
      resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    sendResetEmail(user.email, resetToken).catch((err) =>
      console.error("Email error:", err),
    );

    return res.status(200).json({ message: responseMessage });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: true, // true in production (HTTPS)
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } catch (err) {
      console.error("Google Auth Error:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

app.post("/logout", (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(0),
    path: "/",
  });

  res.json({ success: true });
});
// Update name
app.put("/profile", authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    await User.update({ name }, { where: { id: req.user.id } });
    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account
app.delete("/delete-account", authenticate, async (req, res) => {
  try {
    await User.destroy({ where: { id: req.user.id } });
    res.clearCookie("token");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
