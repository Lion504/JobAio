import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: String,
  link: String,
  company: String,
  location: String,
  description: String,
}, { timestamps: true });

export const Job = mongoose.model("Job", jobSchema);

export default Job;
