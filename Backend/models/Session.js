const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    language: {
      type: String,
      enum: [
        "javascript",
        "python",
        "cpp",
        "java",
        "c",
        "ruby",
        "go",
        "php",
        "typescript",
        "csharp",
        "swift",
        "kotlin",
      ],
      required: true,
    },

    code: {
      type: String,
      default: "",
    },

    ownerId: {
      type: String, // PostgreSQL UUID stored as string
      required: true,
    },

    fontSize: {
      type: Number,
      default: 18,
    },

    sharedWith: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Index for fast lookup of sessions shared with a user
sessionSchema.index({ sharedWith: 1 });

module.exports = mongoose.model("Session", sessionSchema);
