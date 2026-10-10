
const sequelize = require("../config/database");
const connectMongo = require("../config/mongo");
require("../models/User");

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL Database connected");

    await connectMongo();
    console.log("MongoDB connected");

    // Start listening only after the databases connect.
    // If your server.js already calls app.listen(),
    // move that call here or call startServer from server.js.
  } catch (error) {
    console.error("Database startup failed:", error.message);
    process.exitCode = 1;
    return;
  }
}

startServer();

let shuttingDown = false;

process.on("SIGTERM", async () => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("SIGTERM received. Closing PostgreSQL...");
  try {
    await sequelize.close();
  } catch (error) {
    console.error("PostgreSQL shutdown error:", error.message);
  }
  process.exit(0);
});
