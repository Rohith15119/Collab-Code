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
      validate: {
        len: [2, 50],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    emailVerificationToken: {
      type: DataTypes.STRING,
    },

    emailVerificationExpiry: {
      type: DataTypes.DATE,
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
    },

    resetTokenExpiry: DataTypes.DATE,
  },
  {
    tableName: "users",
    timestamps: true,
  },
);

module.exports = User;
