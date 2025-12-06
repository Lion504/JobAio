import mongoose from "mongoose";

const originalJobSchema = new mongoose.Schema(
  {
    title: { type: String, index: true },
    url: { type: String },
    company: { type: String, index: true },
    location: { type: String, index: true },
    publish_date: { type: String },
    description: { type: String },
    original_title: { type: String },
    original_description: { type: String },

    industry_category: { type: String, index: true },
    job_type: { type: [String], index: true },
    language: {
      required: { type: [String], index: true },
      advantage: { type: [String], index: true },
    },
    experience_level: { type: String, index: true },
    education_level: { type: [String], index: true },
    skill_type: {
      technical: { type: [String] },
      domain_specific: { type: [String] },
      certifications: { type: [String] },
      soft_skills: { type: [String] },
      other: { type: [String] },
    },
    responsibilities: { type: [String] },

    _metadata: { type: Object },

    job_id: { type: Number, unique: true, index: true },
  },
  { timestamps: true },
);

jobSchema.index(
  //Fields to index
  {
    title: "text",
    description: "text",
    "skill_type.technical": "text",
    "skill_type.certifications": "text",
    "skill_type.domain_specific": "text",
    "skill_type.soft_skills": "text",
    responsibilities: "text",
    job_type: "text",
    experience_level: "text",
    "language.required": "text",
    "language.advantage": "text",
    education_level: "text",
  },
  {
    weights: {
      title: 10,
      original_title: 10,
      "skill_type.technical": 5,
      "skill_type.certifications": 5,
      "language.required": 5,
      "skill_type.domain_specific": 3,
      "skill_type.soft_skills": 3,
      job_type: 3,
      responsibilities: 2,
      "language.advantage": 2,
      experience_level: 1,
      education_level: 1,
      description: 1,
    },
    name: "FullTextSearchIndex",
  },
);

export const Job = mongoose.model("Job", jobSchema);

export default Job;
