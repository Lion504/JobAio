export function normalizeScrapedJob(raw) {
  return {
    source_language: raw["source_language"] || "",

    job_description: raw["Job description"] || "",
    skill_types: raw["Skill Types"] || "",
    responsibilities: raw["Responsibilities"] || "",
    other: raw["other"] || "",
    advantages: raw["advantages"] || "",

    job_title: raw["Job Title"] || "",
    job_category: raw["Job Category"] || "",
    job_type: raw["Job Type"] || "",

    language_required: raw["Language_required"] || "",
    experience_level: raw["experience level"] || "",

    company_name: raw["Company_Name"] || "",
    location: raw["Location"] || "",

    education_level: raw["Education Level"] || "",
    certification: raw["Certification"] || "",

    job_link: raw["Job_Link"] || "",
    job_source: raw["Job source"] || "",

    publish_date: raw["Publish date"] || "",
    deadline: raw["Deadline"] || "",
  };
}
