const mongoose = require("mongoose");

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      maxPoolSize: 30,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45_0000,
    });
    console.log("MongoDB Database connected ✅");
  } catch (err) {
    console.error("Mongo connection error:", err);
    process.exit(1);
  }
}

module.exports = connectMongo;
