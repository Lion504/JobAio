// TODO: Implement API entry point

// apps/api/src/index.js
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const path = require("path");

const PORT = process.env.PORT || 5001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/jobaio";

async function start() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const seedPath = path.join(__dirname, "../../../packages/db/src/seed.js");
    const { seedDatabase } = await import(`file://${seedPath}`);

    console.log("Checking database...");
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
