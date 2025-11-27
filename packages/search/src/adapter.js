// packages/search/src/adapter.js

import OriginalJob from "../../db/src/models/OriginalJob.js";
import TranslatedJob from "../../db/src/models/TranslatedJob.js"; // not used yet, but ready

// Single-field search with regex (case-insensitive)
export async function findJobsByField(field, value) {
  const expression = new RegExp(value, "i");
  const query = { [field]: expression };
  const jobs = await OriginalJob.find(query).sort({ createdAt: -1 }).lean();
  return jobs;
}

// Multi-field AND search, all fields use regex (case-insensitive)
// filters = { job_category, experience_level, language_required, job_type, company_name, location, ... }
// options.translationLang is optional – for now we just log and would use TranslatedJob later.
export async function findJobsByFilters(filters, options = {}) {
  const { translationLang } = options;

  if (translationLang) {
    // Stub for later real implementation
    console.log(`
      get the translated job from translatedModel (translation_lang = ${translationLang})
    `);
    // e.g. future: await TranslatedJob.find({ translation_lang: translationLang, ... })
  }

  const query = {};
  for (const [field, value] of Object.entries(filters)) {
    if (!value) continue;
    query[field] = new RegExp(value, "i");
  }

  const jobs = await OriginalJob.find(query).sort({ createdAt: -1 }).lean();
  return jobs;
}

// All jobs (original)
export async function findAllJobs() {
  const jobs = await OriginalJob.find().sort({ createdAt: -1 }).lean();
  return jobs;
}

// Keyword search across several text fields of OriginalJob
export async function searchJobs(term) {
  const expression = new RegExp(term, "i");

  const query = {
    $or: [
      { job_title: expression },
      { company_name: expression },
      { location: expression },
      { job_description: expression },
    ],
  };

  const jobs = await OriginalJob.find(query).sort({ createdAt: -1 }).lean();
  return jobs;
}