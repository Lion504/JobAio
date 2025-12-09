export interface JobStat {
  label: string
  count: number
  percentage: number
}

export interface MarketInsights {
  totalJobs: number
  topSkills: JobStat[]
  languages: JobStat[]
  experienceDistribution: JobStat[]
  educationDistribution: JobStat[]
}

export const initialInsights: MarketInsights = {
  totalJobs: 0,
  topSkills: [],
  languages: [],
  experienceDistribution: [],
  educationDistribution: [],
}
