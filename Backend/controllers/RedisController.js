const { redisClient } = require("../services/Limiter");

async function getCached(ownerId) {
  try {
    const data = await redisClient.get(`sessions:${ownerId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

async function setCache(ownerId, data) {
  try {
    await redisClient.set(
      `sessions:${ownerId}`,
      JSON.stringify(data),
      "PX",
      15_000,
    );
  } catch {
    // silent fail
  }
}

async function invalidateCache(ownerId) {
  try {
    const pattern = `sessions:${ownerId}*`;
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redisClient.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      if (keys.length) await redisClient.del(...keys);
    } while (cursor !== "0");
  } catch {
    // silent fail
  }
}

module.exports = { getCached, setCache, invalidateCache };
