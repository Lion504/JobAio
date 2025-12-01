// apps/api/src/index.js

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { flagJobWithLanguageMatch } from "./utils/languageMatch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Very simple CORS so your Next.js app (localhost:3000) can call this API
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,POST,PUT,PATCH,DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Load translated jobs from the JSON file
const dataPath = path.join(__dirname, "..", "data", "translated_jobs.json");

let translatedJobs = [];

try {
  const raw = fs.readFileSync(dataPath, "utf-8");
  const parsed = JSON.parse(raw);
  translatedJobs = parsed.jobs || [];
  console.log(
    `Loaded ${translatedJobs.length} translated jobs from translated_jobs.json`,
  );
} catch (err) {
  console.error("Failed to read translated_jobs.json:", err);
}

// GET /api/jobs?userLangs=en,fi,si
app.get("/api/jobs", (req, res) => {
  const userLangsParam = req.query.userLangs;

  const userLanguages =
    typeof userLangsParam === "string" && userLangsParam.length > 0
      ? userLangsParam.split(",")
      : [];

  const jobsWithFlags = translatedJobs.map((job) =>
    flagJobWithLanguageMatch(job, userLanguages),
  );

  res.json({
    count: jobsWithFlags.length,
    jobs: jobsWithFlags,
  });
});

app.listen(PORT, () => {
  console.log(`JobAio API listening on http://localhost:${PORT}/api/jobs`);
});
