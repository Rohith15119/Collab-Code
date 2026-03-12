const express = require("express");
const passport = require("../config/Google");
const authenticate = require("../middleware/auth");
const { loginLimiter } = require("../services/Limiter");
const Auth = require("../controllers/AuthController");
const Profile = require("../controllers/ProfileController");

const {
  registerValidation,
  loginValidation,
  validate,
} = require("../validators/AuthValidator");

const app = express.Router();

app.use(express.json());

app.use(passport.initialize());

app.get("/me", authenticate, Auth.VerifyMySelf);

app.post("/register", registerValidation, Auth.RegisterUser);

app.post(
  "/login",
  loginLimiter(
    15 * 60 * 1000,
    5,
    "Too many login attempts. Try again later.",
    true,
  ),
  loginValidation,
  Auth.LoginUser,
);

app.post("/reset-password/:token", Auth.PasswordReset);

app.post("/forgot-password-request", Auth.PasswordResetRequest);

app.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.post("/verify-account/:token", Auth.VerifyAccount);

app.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  Auth.GoogleCallback,
);

app.post("/logout", Profile.LogoutAccount);

app.put("/profile", authenticate, Profile.Profile);

app.delete("/delete-account", authenticate, Profile.DeleteAccountDetails);

module.exports = app;
