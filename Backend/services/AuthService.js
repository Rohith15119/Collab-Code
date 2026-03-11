const User = require("../models/User");
const { Op } = require("sequelize");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Identify = async (userId) => {
  return await User.findByPk(userId, {
    attributes: ["id", "name", "email", "provider"],
  });
};

const isExists = async (email) => {
  return await User.findOne({ where: { email } });
};

const LoginUser = async (name, email, hashedPassword) => {
  return await User.create({
    name,
    email,
    password: hashedPassword,
    provider: "local",
  });
};

const ExistingUser = async (email) => {
  return await User.findOne({
    where: { email },
    raw: true,
    attributes: ["id", "email", "name", "password", "provider"],
  });
};

const CheckUserToken = async (hashedToken) => {
  return await User.findOne({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { [Op.gt]: new Date() },
    },
  });
};

const ResetToken = async (req) => {
  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token || resetToken)
    .digest("hex");

  if (!req.params.token) {
    await User.update(
      {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
      {
        where: { id: req.user.id },
      },
    );
  }

  return hashedToken;
};

const DigitalSignature = async (id, email) => {
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
};
