const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");

const express = require("express");
const app = express.Router();

app.get("/profile", authenticate, authorize("user"), (req, res) => {
  res.json({ message: "Protected route" });
});

app.get("/admin", authenticate, authorize("admin"), (req, res) => {
  res.status(200).json({ message: "Admin access granted" });
});

module.exports = app;
