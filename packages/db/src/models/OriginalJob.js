
import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const originalJobSchema = new mongoose.Schema(
  {
    title: { type: String },
    url: { type: String },
    company: { type: String },
    location: { type: String },
    publish_date: { type: String },
    description: { type: String },
    original_title: { type: String },
    original_description: { type: String },

    industry_category: { type: String },
    job_type: { type: [String] },
    language: {
      required: { type: [String] },
      advantage: { type: [String] },
    },
    experience_level: { type: String },
    education_level: { type: [String] },
    skill_type: {
      technical: { type: [String] },
      domain_specific: { type: [String] },
      certifications: { type: [String] },
      soft_skills: { type: [String] },
      other: { type: [String] },
    },
    responsibilities: { type: [String] },

    _metadata: { type: Object },

    job_id: { type: Number, unique: true },
  },
  { timestamps: true }
);

//  prevent duplicates with same (title, company, location)
originalJobSchema.index(
  { title: 1, company: 1, location: 1 },
  { unique: true }
);

// TTL index → delete after 14 days
originalJobSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 14 }
);

originalJobSchema.plugin(AutoIncrement, { inc_field: "job_id" });

export default mongoose.model("OriginalJob", originalJobSchema);
