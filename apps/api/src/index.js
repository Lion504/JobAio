// apps/api/src/index.js

import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/jobaio";

// MongoDB connection state
let isMongoConnected = false;
let rankedJobSearch = null;
let findAllJobs = null;

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,POST,PUT,PATCH,DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// GET /api/jobs?search=developer&location=Helsinki
app.get("/api/jobs", async (req, res) => {
  const { search, location, job_type, experience_level, company } = req.query;

  try {
    if (isMongoConnected && rankedJobSearch) {
      const filters = {};
      if (location) filters.location = location;
      if (job_type) filters.job_type = job_type;
      if (experience_level) filters.experience_level = experience_level;
      if (company) filters.company = company;

      const jobs = await rankedJobSearch(search || "", filters);
      return res.json({
        count: jobs.length,
        jobs: jobs,
        source: "mongodb",
        search: search || null,
      });
    }
  } catch (err) {
    console.error("MongoDB search failed:", err.message);
  }

  // Fallback to JSON
  res.json({
    count: translatedJobs.length,
    jobs: translatedJobs,
    source: "json",
  });
});

// Connect to MongoDB then start server
async function startServer() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    isMongoConnected = true;
    console.log("MongoDB connected");

    // Import search adapter after connection
    const searchAdapter = await import(
      "../../../packages/search/src/adapter.js"
    );
    rankedJobSearch = searchAdapter.rankedJobSearch;
    findAllJobs = searchAdapter.findAllJobs;
    console.log("Search adapter loaded");
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
