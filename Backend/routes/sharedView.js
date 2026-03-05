const express = require("express");
const Session = require("../models/Session");
const rateLimit = require("express-rate-limit");
const authenticate = require("../middleware/auth");

const app = express.Router();

app.use(express.json());
