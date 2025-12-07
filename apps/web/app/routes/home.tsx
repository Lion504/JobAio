import { useState } from 'react'
import { useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { ScrollArea } from '@/components/ui/scroll-area'
import { JobCard, type Job } from '@/components/job-card'

interface ApiJob {
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

interface ApiResponse {
  count: number
  jobs: ApiJob[]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search')

  const backendEndpoint = import.meta.env.WEB_APP_BACKEND_ENDPOINT
  if (!backendEndpoint) {
    throw new Error('WEB_APP_BACKEND_ENDPOINT is not set')
  }

  const apiUrl = new URL(
    search ? '/api/jobs/search' : '/api/jobs',
    backendEndpoint
  )

  if (search) {
    apiUrl.searchParams.append('term', search)
  }

  try {
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error('Failed to fetch jobs')

    const result: ApiResponse = await res.json()
    const data = result.jobs || []

    const jobs: Job[] = data.map((job, index) => ({
      id: job._id || String(index),
      title: job.title || 'Untitled',
      company: job.company || 'Unknown Company',
      location: job.location || 'Remote',
      link: job.url || '',
      salary: 'Competitive',
      type: job.job_type?.[0] || 'Full-time',
      jobTypes: job.job_type || [],
      experienceLevel: job.experience_level || 'Not specified',
      educationLevels: job.education_level || [],
      languagesRequired: job.language?.required || [],
      languagesAdvantage: job.language?.advantage || [],
      responsibilities: job.responsibilities || [],
      skillType: {
        technical: job.skill_type?.technical || [],
        domainSpecific: job.skill_type?.domain_specific || [],
        certifications: job.skill_type?.certifications || [],
        softSkills: job.skill_type?.soft_skills || [],
        other: job.skill_type?.other || [],
      },
      industryCategory: job.industry_category || '',
      postedAt: job.publish_date || new Date().toLocaleDateString(),
      updatedAt: job.updatedAt || '',
      description: job.description || '',
      source: job.source || '',
      tags: job.industry_category ? [job.industry_category] : [],
    }))
    return { jobs }
  } catch (error) {
    console.error('Error loading jobs:', error)
    return { jobs: [] }
  }
}

export default function Home() {
  const { jobs } = useLoaderData<typeof loader>()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden bg-muted/50 relative">
        <div className="absolute top-4 right-6 z-10">
          <span className="text-sm text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border shadow-sm">
            Showing {jobs.length} jobs
          </span>
        </div>
        <ScrollArea className="h-full w-full">
          <div className="mx-auto max-w-3xl space-y-4 p-6 pt-12">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJobId === job.id}
                  onClick={() => setSelectedJobId(job.id)}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground mt-10">
                No jobs found.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
