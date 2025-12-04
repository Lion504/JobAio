import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);


const originalJobSchema = new mongoose.Schema(
  {
    title: { type: String, index: true },
    url: { type: String },
    company: { type: String, index: true },
    location: { type: String, index: true },
    publish_date: { type: String, index: true },
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

      _metadata: { type: Object },

      job_id: { type: Number, unique: true },
    },
  { timestamps: true }
);

//  prevent duplicates with same (title, company, location)
originalJobSchema.index(
  { title: 1, company: 1, location: 1 },
  { unique: true },
);

// TTL index → delete after 14 days
originalJobSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 14 },
);

//Fields to index for the search engine
originalJobSchema.index(
  {
    title: "text",
    description: "text",
    original_title: "text",
    original_description: "text",
    "skill_type.technical": "text",
    "skill_type.certifications": "text",
    "skill_type.domain_specific": "text",
    "skill_type.soft_skills": "text",
    responsibilities: "text",
    job_type: "text",
    experience_level: "text",
    "language_required": "text",
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
      original_description: 1
    },
    name: "FullTextSearchIndex",
  },
);

originalJobSchema.plugin(AutoIncrement, { inc_field: "job_id" });

export default mongoose.model("OriginalJob", originalJobSchema);
