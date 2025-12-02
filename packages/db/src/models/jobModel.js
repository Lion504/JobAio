import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, index: true },
  url: String,
  company: { type: String, index: true },
  location: { type: String, index: true },
  description: String,
  experience_level: { type: String, index: true },
  job_type: { type: [String], index: true },
  responsibilities: [String],
  skill_type: {
    technical: [String],
    domain_specific: [String],
    soft_skills: [String],
    certifications: [String],
    other: [String]
  }
}, { timestamps: true });

jobSchema.index (
  //Fields to index
  {
    title: 'text',
    description: 'text',
    'skill_type.technical': 'text',
    'skill_type.certifications': 'text',
    'skill_type.domain_specific': 'text',
    'skill_type.soft_skills': 'text',
    responsibilities: 'text',
    job_type: 'text',
    experience_level: 'text'
  },
{
  weights: {
    title: 10,
    'skill_type.technical': 5,
    'skill_type.certifications': 5,
    'skill_type.domain_specific': 3,
    'skill_type.soft_skills': 3,
    job_type: 3,
    responsibilities: 2,
    experience_level: 1,
    description: 1
  },
  name: "FullTextSearchIndex"
}
);

export const Job = mongoose.model("Job", jobSchema);

export default Job;
