export interface ApiJob {
  _id: string
  title: string
  company: string
  location: string
  url: string
  job_type: string[]
  publish_date: string
  updatedAt?: string
  description: string
  industry_category: string
  experience_level?: string
  education_level?: string[]
  language?: {
    required?: string[]
    advantage?: string[]
  }
  responsibilities?: string[]
  skill_type?: {
    technical?: string[]
    domain_specific?: string[]
    certifications?: string[]
    soft_skills?: string[]
    other?: string[]
  }
  source?: string
}

export interface Job {
  id: string
  title: string
  company: string
  logo?: string
  location: string
  salary: string
  type: string
  jobTypes: string[]
  experienceLevel: string
  educationLevels: string[]
  languagesRequired: string[]
  languagesAdvantage: string[]
  responsibilities: string[]
  skillType: {
    technical: string[]
    domainSpecific: string[]
    certifications: string[]
    softSkills: string[]
    other: string[]
  }
  industryCategory: string
  postedAt: string
  updatedAt?: string
  description: string
  tags: string[]
  source?: string
  link?: string
}

export interface SearchSuggestion {
  id: string
  title: string
  company?: string
  location?: string
}
