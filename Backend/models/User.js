const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [2, 50] },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_verified", // ← maps to DB column
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      field: "email_verification_token",
    },
    emailVerificationExpiry: {
      type: DataTypes.DATE,
      field: "email_verification_expiry",
    },
    provider: {
      type: DataTypes.ENUM("local", "google", "facebook", "github"),
      allowNull: false,
      defaultValue: "local",
    },
    provider_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "reset_token",
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      field: "reset_token_expiry",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true, // ← handles createdAt→created_at, updatedAt→updated_at
  },
);

module.exports = User;
