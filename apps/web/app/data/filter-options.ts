export type FilterOption = {
  label: string
  value: string
}

export const jobTypeOptions: FilterOption[] = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Internship', value: 'internship' },
  { label: 'Temporary', value: 'temporary' },
]

export const experienceLevelOptions: FilterOption[] = [
  { label: 'Internship', value: 'internship' },
  { label: 'Entry level', value: 'entry' },
  { label: 'Mid level', value: 'mid' },
  { label: 'Senior', value: 'senior' },
  { label: 'Lead', value: 'lead' },
  { label: 'Manager / Director', value: 'manager' },
]

export const industryCategoryOptions: FilterOption[] = [
  { label: 'Information Technology', value: 'information technology' },
  { label: 'Finance', value: 'finance' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Education', value: 'education' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Retail & E-commerce', value: 'retail' },
  { label: 'Marketing & Advertising', value: 'marketing' },
  { label: 'Government & Public', value: 'government' },
  { label: 'Non-profit', value: 'non-profit' },
]

export const languageOptions: FilterOption[] = [
  { label: 'English', value: 'english' },
  { label: 'Finnish', value: 'finnish' },
  { label: 'Swedish', value: 'swedish' },
  { label: 'German', value: 'german' },
  { label: 'French', value: 'french' },
  { label: 'Spanish', value: 'spanish' },
]

export const educationLevelOptions: FilterOption[] = [
  { label: 'High school / Secondary', value: 'high school' },
  { label: 'Vocational / Certificate', value: 'certificate' },
  { label: 'Associate degree', value: 'associate' },
  { label: "Bachelor's degree", value: 'bachelor' },
  { label: "Master's degree", value: 'master' },
  { label: 'Doctorate / PhD', value: 'doctorate' },
]
