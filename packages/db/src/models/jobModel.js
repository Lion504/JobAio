import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  description: String,
  skills: [String],
  source: String,
}, { timestamps: true });

export const Job = mongoose.model("Job", jobSchema);
