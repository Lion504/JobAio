import mongoose from "mongoose";

const OriginalJobSchema = new mongoose.Schema({
  source_language: String,

  job_description: String,
  skill_types: String,
  responsibilities: String,
  other: String,
  advantages: String,
  job_title: String,
  job_category: String,
  job_type: String,
  language_required: String,
  experience_level: String,

  company_name: String,
  location: String,
  education_level: String,
  certification: String,
  job_link: String,
  job_source: String,
  publish_date: Date,
  deadline: Date
}, { timestamps: true });

export default mongoose.model("OriginalJob", OriginalJobSchema);