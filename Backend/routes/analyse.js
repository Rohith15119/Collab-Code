const express = require("express");
const { loginLimiter } = require("../services/Limiter");
const Analyze = require("../controllers/ComplexityController");

const router = express.Router();

router.post(
  "/analyze-complexity",
  loginLimiter(
    60 * 1000,
    10,
    "Too many requests. Please try again in 1 minute.",
    false,
  ),
  Analyze.AnalyzeComplexity,
);

module.exports = router;
