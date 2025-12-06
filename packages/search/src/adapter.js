// Search adapter/controller for job queries
import OriginalJob from "../../db/src/models/OriginalJob.js";
import TranslatedJob from "../../db/src/models/TranslatedJob.js"; // not used yet, but ready
import { expandQueryWithSynonyms } from "../../ai/src/embeddings.js";

export async function rankedJobSearch(terms, filters = {}) {
  // Expand query with semantically similar terms using Gemini
  let searchTerms = terms;
  if (terms && terms.trim()) {
    try {
      const expandedTerms = await expandQueryWithSynonyms(terms);
      searchTerms = expandedTerms.join(" ");
      console.log(
        `🔍 Expanded search "${terms}" to: ${expandedTerms.join(", ")}`,
      );
    } catch (error) {
      console.warn(`Query expansion failed, using original: ${error.message}`);
      searchTerms = terms;
    }
  }
  const searchTerm = (searchTerms || "").trim();
  const hasSearchTerm = searchTerm.length > 0;

  //Empty object for filter criteria
  const filterCriteria = {};

  //Dynamic filters
  if (filters.location) {
    //Case insensitive
    filterCriteria.location = new RegExp(filters.location, "i");
  }

  if (filters.job_type) {
    //Case insensitive
    filterCriteria.job_type = new RegExp(filters.job_type, "i");
  }

  if (filters.experience_level) {
    //Case insensitive
    filterCriteria.experience_level = new RegExp(filters.experience_level, "i");
  }

  if (filters.company) {
    //Case insensitive
    filterCriteria.company = new RegExp(filters.company, "i");
  }

  if (filters.industry_category) {
    filterCriteria.industry_category = new RegExp(
      filters.industry_category,
      "i",
    );
  }

  if (filters.required_language) {
    filterCriteria["language.required"] = new RegExp(
      filters.required_language,
      "i",
    );
  }

  if (filters.education_level) {
    filterCriteria.education_level = new RegExp(filters.education_level, "i");
  }

  // Pipeline
  const pipeline = [];

  const matchConditions = [filterCriteria];

  if (hasSearchTerm) {
    matchConditions.push({ $text: { $search: searchTerm } });
  }

  // Filtering
  pipeline.push({
    $match: {
      $and: matchConditions,
    },
  });

  // Scoring: only scores if a search term exists
  if (hasSearchTerm) {
    pipeline.push({
      $addFields: {
        score: { $meta: "textScore" },
      },
    });
  }

  // Sorting
  const sortCriteria = hasSearchTerm
    ? { score: -1, createdAt: -1 }
    : { createdAt: -1 };

  pipeline.push({
    $sort: sortCriteria,
  });

  const jobs = await OriginalJob.aggregate(pipeline);
  return jobs;
}

// All jobs (original)
export async function findAllJobs() {
  const jobs = await OriginalJob.find().sort({ createdAt: -1 }).lean();
  return jobs;
}
