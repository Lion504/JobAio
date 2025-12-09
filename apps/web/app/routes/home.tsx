import { useEffect, useState } from 'react'
import {
  useLoaderData,
  useSearchParams,
  useNavigate,
  type LoaderFunctionArgs,
} from 'react-router'
import { ScrollArea } from '@/components/ui/scroll-area'
import { JobCard } from '@/components/job-card'
import { getApiUrl } from '@/lib/api'
import { type ApiJob, type Job } from '@/types'
import { useTranslation } from 'react-i18next'

interface ApiResponse {
  count: number
  jobs: ApiJob[]
  search?: string | null
  originalSearch?: string | null
  ai?: boolean
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search')
  const filtersParam = url.searchParams.get('filters')
  const langParam = url.searchParams.get('lang')
  const aiParam = url.searchParams.get('ai')

  try {
    const apiUrl = getApiUrl('/api/jobs')

    if (search) {
      apiUrl.searchParams.append('q', search)
    }

    if (filtersParam) {
      apiUrl.searchParams.append('filters', filtersParam)
    }

    const lang = langParam || 'en'
    if (lang) {
      apiUrl.searchParams.append('lang', lang)
    }

    // Enable AI search expansion when ai=true
    if (aiParam === 'true') {
      apiUrl.searchParams.append('ai', 'true')
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

    return {
      jobs,
      search: result.search || null,
      originalSearch: result.originalSearch || null,
      aiEnabled: result.ai || false,
    }
  } catch (error) {
    console.error('Error loading jobs:', error)
    return { jobs: [], search: null, originalSearch: null, aiEnabled: false }
  }
}

export default function Home() {
  const { jobs, search, originalSearch, aiEnabled } =
    useLoaderData<typeof loader>()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Update URL with expanded search term if AI expanded it
  useEffect(() => {
    if (aiEnabled && search && originalSearch && search !== originalSearch) {
      const currentUrlSearch = searchParams.get('search')
      // Only update if URL still has the original search (avoid loops)
      if (currentUrlSearch === originalSearch) {
        const newParams = new URLSearchParams(searchParams)
        newParams.set('search', search)
        navigate(`/?${newParams.toString()}`, { replace: true })
      }
    }
  }, [search, originalSearch, aiEnabled, searchParams, navigate])

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
