import mongoose from "mongoose";
import { Job } from "./models/jobModel.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jobsDataPath = join(__dirname, "../data/jobs.json");
const jobsData = JSON.parse(readFileSync(jobsDataPath, "utf-8"));

export async function seedDatabase() {
  try {
    const existingJobCount = await Job.countDocuments();

    if (existingJobCount === 0) {
      console.log("Database is empty. Seeding with initial data...");

      const insertedJobs = await Job.insertMany(jobsData);
      console.log(
        `Successfully seeded ${insertedJobs.length} jobs into the database`,
      );

      return insertedJobs.length;
    } else {
      console.log(
        `Database already contains ${existingJobCount} jobs. Skipping seed.`,
      );
      return 0;
    }
  } catch (error) {
    console.error("Error seeding database:", error.message);
    throw error;
  }
}
