const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL, {
  commandTimeout: 2000,
  maxRetriesPerRequest: 1,
});

redisClient.on("error", (err) => console.error("Auth Redis Error: ", err));

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
  }

  return rateLimit(options);
};

module.exports = { loginLimiter, redisClient };
