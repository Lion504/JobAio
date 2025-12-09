// apps/api/src/index.js

import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT || 5001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/jobaio";

// MongoDB connection state
let isMongoConnected = false;

// Connect to MongoDB then start server
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    isMongoConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.warn("MongoDB connection failed:", err.message);
    isMongoConnected = false;
  }

  app.listen(PORT, () => {
    console.log(`JobAio API listening on http://localhost:${PORT}/api/jobs`);
    console.log(`Data source: ${isMongoConnected ? "MongoDB" : "JSON file"}`);
  });
}

startServer();
