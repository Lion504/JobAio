import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const originalJobSchema = new mongoose.Schema(
  {
    source_language: { type: String },

    // Auto-incremented job_id (do NOT send this in POST)
    job_id: { type: Number, unique: true },

    job_description: { type: String },
    skill_types: { type: String },
    responsibilities: { type: String },
    other: { type: String },
    advantages: { type: String },

    job_title: { type: String },
    job_category: { type: String },
    job_type: { type: String },

    language_required: { type: String },
    experience_level: { type: String },

    company_name: { type: String },
    location: { type: String },

    education_level: { type: String },
    certification: { type: String },

    job_link: { type: String },
    job_source: { type: String },

    publish_date: { type: String },
    deadline: { type: String },
  },
  { timestamps: true }
);

// Plugin to auto-increment job_id
originalJobSchema.plugin(AutoIncrement, { inc_field: "job_id" });

export default mongoose.model("OriginalJob", originalJobSchema);
