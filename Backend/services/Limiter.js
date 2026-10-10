const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const Redis = require("ioredis");

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is missing");
}

const redisClient = new Redis(process.env.REDIS_URL, {
  connectTimeout: 10000,
  commandTimeout: 5000,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    return Math.min(times * 500, 3000);
  },
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redisClient.on("ready", () => {
  console.log("Redis is ready");
});

const loginLimiter = (Millisecs, limit, message, isStore) => {
  const options = {
    windowMs: Millisecs,
    max: limit,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  };

  if (isStore) {
    options.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    });

    options.passOnStoreError = false;
  }

  return rateLimit(options);
};

module.exports = { loginLimiter, redisClient };