import mongoose from "mongoose";

const TranslatedJobSchema = new mongoose.Schema(
  {
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "OriginalJob" },
    translation_lang: String,

    // Core translated fields (matching OriginalJob structure)
    title: { type: String, index: true },
    url: String,
    company: { type: String, index: true },
    location: { type: String, index: true },
    publish_date: { type: String, index: true },
    source: String,
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
  },
  { timestamps: true },
);

TranslatedJobSchema.index({ job_id: 1, translation_lang: 1 }, { unique: true });

// TTL index → delete after 14 days
TranslatedJobSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 14 },
);

export default mongoose.model("TranslatedJob", TranslatedJobSchema);
