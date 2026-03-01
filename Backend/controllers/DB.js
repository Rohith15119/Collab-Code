const sequelize = require("../config/database");
const connectMongo = require("../config/mongo");
require("../models/User");

let isConnected = false;

async function startServer() {
  try {
    await Promise.all([sequelize.authenticate(), connectMongo()]);
    console.log("PostgreSQL Database connected ✅");

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("🛠 Tables synced (development mode)");
    }

    isConnected = true;
  } catch (error) {
    console.error("❌ Failed to connect to database");
    console.error("Error:", error);
    process.exit(1);
  }
}

startServer();

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received. Closing DB...");
  await sequelize.close();
  process.exit(0);
});
