import { useState } from 'react'
import { useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { ScrollArea } from '@/components/ui/scroll-area'
import { JobCard, type Job } from '@/components/job-card'

interface ApiJob {
  original_job: {
    title: string
    description: string
    industry?: string
    experience?: string
    job_original_language?: string
  }
  translations: Array<{
    translation_language: string
    title: string
    description: string
  }>
  languageMatch?: boolean
}
interface ApiResponse {
  count: number
  jobs: ApiJob[]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search')

  let apiUrl = 'http://localhost:5001/api/jobs'
  if (search) {
    apiUrl += `?search=${encodeURIComponent(search)}`
  }

  try {
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error('Failed to fetch jobs')

    const result: ApiResponse = await res.json()
    const data = result.jobs || []

    const jobs: Job[] = data.map((job: any, index) => ({
      id: job._id || String(index),
      title: job.title || 'Untitled',
      company: job.company || 'Unknown Company',
      location: job.location || 'Remote',
      link: job.url || '',
      salary: 'Competitive',
      type: job.job_type?.[0] || 'Full-time',
      postedAt: job.publish_date || new Date().toLocaleDateString(),
      description: job.description || '',
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
