const User = require("../models/User");
const { Op } = require("sequelize");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Identify = async (userId) => {
  return User.findByPk(userId, {
    attributes: ["id", "name", "email", "provider", "isVerified"],
  });
};

const isExists = async (email) => {
  return User.findOne({ where: { email } });
};

const LoginUser = async (name, email, hashedPassword) => {
  return User.create({
    name,
    email,
    password: hashedPassword,
    provider: "local",
  });
};

const ExistingUser = async (email) => {
  return User.findOne({
    where: { email },
    attributes: ["id", "email", "name", "password", "provider", "isVerified"],
  });
};

const CheckUserToken = async (hashedToken) => {
  return User.findOne({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { [Op.gt]: new Date() },
    },
  });
};

const checkVerifyToken = async (hashedToken) => {
  return User.findOne({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { [Op.gt]: new Date() },
    },
  });
};

const ResetToken = async (user) => {
  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await user.update({
    resetToken: hashedToken,
    resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });

  return resetToken;
};

const GenerateVerificationToken = async (user) => {
  const token = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  await user.update({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  return token;
};

const DigitalSignature = (id, email) => {
  return jwt.sign({ id: id, email: email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const PasswordService = (user, hashedPassword) => {
  user.password = hashedPassword;
  user.resetToken = null;
  user.resetTokenExpiry = null;
};

module.exports = {
  Identify,
  isExists,
  LoginUser,
  ExistingUser,
  CheckUserToken,
  ResetToken,
  DigitalSignature,
  PasswordService,
  checkVerifyToken,
  GenerateVerificationToken,
};
