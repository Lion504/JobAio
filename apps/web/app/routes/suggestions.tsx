import { useState } from 'react'
import {
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
  type HeadersFunction,
  type MetaFunction,
  type ShouldRevalidateFunction,
} from 'react-router'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { JobCard } from '@/components/job-card'
import { getApiUrl } from '@/lib/api'
import { type ApiJob, type Job } from '@/types'
import { detectRequestLanguage } from '@/i18n'

type PreferencesState = {
  jobTags?: string
  skills?: string
  languages?: string[]
  location?: string[]
  interfaceLanguage?: string
}

type SuggestionsResult = {
  jobs: Job[]
  hasPreferences: boolean
  lang: string
}

const PREFERENCES_COOKIE = 'jobaio-preferences'

function parsePreferencesCookie(request: Request): PreferencesState | null {
  const cookie = request.headers.get('cookie') || ''
  const raw = cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${PREFERENCES_COOKIE}=`))
  if (!raw) return null
  const [, value] = raw.split('=')
  try {
    return JSON.parse(decodeURIComponent(value)) as PreferencesState
  } catch {
    return null
  }
}

async function fetchSuggestions(request: Request): Promise<SuggestionsResult> {
  const url = new URL(request.url)
  const requestLang = detectRequestLanguage(request)
  const cookiePrefs = parsePreferencesCookie(request)
  const lang =
    url.searchParams.get('lang') ||
    cookiePrefs?.interfaceLanguage ||
    requestLang ||
    'en'

  const hasTags = !!cookiePrefs?.jobTags?.trim()
  const hasSkills = !!cookiePrefs?.skills?.trim()
  const hasLocations =
    Array.isArray(cookiePrefs?.location) && cookiePrefs.location.length > 0
  const hasLanguages =
    Array.isArray(cookiePrefs?.languages) && cookiePrefs.languages.length > 0

  const hasPreferences = hasTags || hasSkills || hasLocations || hasLanguages
  if (!hasPreferences) {
    return { jobs: [], hasPreferences: false, lang }
  }

  const searchTerms = [cookiePrefs?.jobTags, cookiePrefs?.skills]
    .filter(Boolean)
    .join(' ')
    .trim()

  const apiUrl = getApiUrl('/api/jobs', request)

  if (searchTerms) {
    apiUrl.searchParams.append('q', searchTerms)
  }

  const filters: Record<string, string> = {}

  if (cookiePrefs?.location && cookiePrefs.location.length > 0) {
    filters.location = cookiePrefs.location.join('|')
  }

  if (cookiePrefs?.languages && cookiePrefs.languages.length > 0) {
    filters.required_language = cookiePrefs.languages.join('|')
  }

  if (Object.keys(filters).length > 0) {
    apiUrl.searchParams.append('filters', JSON.stringify(filters))
  }

  apiUrl.searchParams.append('lang', lang || 'en')
  if (searchTerms) {
    apiUrl.searchParams.append('ai', 'true')
  }

  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error('Failed to fetch suggestions')

  const result = await res.json()
  const data: ApiJob[] = result.jobs || []

  const mappedJobs: Job[] = data.map((job, index) => ({
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
    postedAt: job.publish_date || new Date().toISOString(),
    updatedAt: job.updatedAt || '',
    description: job.description || '',
    source: job.source || '',
    tags: job.industry_category ? [job.industry_category] : [],
  }))

  mappedJobs.sort((a, b) => {
    return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  })

  return {
    jobs: mappedJobs,
    hasPreferences: true,
    lang,
  }
}

export const meta: MetaFunction = () => [
  { title: 'JobAio | Suggestions' },
  {
    name: 'description',
    content: 'AI-assisted job suggestions based on your preferences.',
  },
]

export const headers: HeadersFunction = () => ({
  'Cache-Control': 'public, max-age=30, s-maxage=60',
})

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
}) => {
  const currentLang = currentUrl.searchParams.get('lang')
  const nextLang = nextUrl.searchParams.get('lang')
  return currentUrl.search !== nextUrl.search || currentLang !== nextLang
}

export async function loader({ request }: LoaderFunctionArgs) {
  return fetchSuggestions(request)
}

function NoPreferences() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold tracking-tight">
        {t('suggestions.noPreferencesTitle', 'Set your preferences')}
      </h2>
      <p className="mb-6 max-w-sm text-muted-foreground">
        {t(
          'suggestions.noPreferencesDesc',
          'Tell us about your skills, preferred locations, and languages to get personalized job recommendations.'
        )}
      </p>
      <Button asChild>
        <Link to="/preferences">
          {t('suggestions.goToPreferences', 'Go to Preferences')}
        </Link>
      </Button>
    </div>
  )
}

function SuggestionsList({ data }: { data: SuggestionsResult }) {
  const { t } = useTranslation()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const { jobs } = data

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden bg-muted/50 relative">
        <div className="absolute top-4 right-6 z-10">
          <span className="text-sm text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border shadow-sm">
            {t('suggestions.foundJobs', {
              count: jobs.length,
              defaultValue: `${jobs.length} Suggested Jobs`,
            })}
          </span>
        </div>
        <ScrollArea className="h-full w-full">
          <div className="mx-auto max-w-3xl space-y-4 p-6 pt-12">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">
                {t('suggestions.title', 'Recommended for You')}
              </h1>
              <p className="text-muted-foreground">
                {t('suggestions.subtitle', 'Based on your profile preferences')}
              </p>
            </div>

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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  {t('suggestions.noMatches', 'No matches found yet')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(
                    'suggestions.refinePreferences',
                    'Try updating your preferences to see more results.'
                  )}
                </p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/preferences">
                    {t('suggestions.updatePreferences', 'Update Preferences')}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default function Suggestions() {
  const data = useLoaderData<typeof loader>()
  return data.hasPreferences ? (
    <SuggestionsList data={data} />
  ) : (
    <NoPreferences />
  )
}
