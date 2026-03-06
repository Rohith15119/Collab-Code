const sequelize = require("../config/database");
const connectMongo = require("../config/mongo");
require("../models/User");

async function startServer() {
  try {
    await Promise.all([sequelize.authenticate(), connectMongo()]);
    console.log("PostgreSQL Database connected ✅");

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("🛠 Tables synced (development mode)");
    }
  } catch (error) {
    console.error("❌ Failed to connect to database");
    console.error("Error:", error);
    process.exit(1);
  }
}

startServer();

process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received. Closing all connections...");
  await Promise.all([
    sequelize.close(),
    mongoose.connection.close(),
    redis.quit(), // if redis is accessible here
  ]);
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received. Closing DB...");
  await sequelize.close();
  process.exit(0);
});
