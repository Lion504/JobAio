import mongoose from "mongoose";

const TranslatedJobSchema = new mongoose.Schema(
  {
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "OriginalJob" },
    translation_lang: String,

    // Non-translated fields (copied from OriginalJob)
    url: String,
    company: String,
    location: String,
    publish_date: String,
    source: String,

    // Translated fields
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
