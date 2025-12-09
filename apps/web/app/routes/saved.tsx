import { JobCard } from '@/components/job-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBookmarks } from '@/context/bookmarks-context'
import {
  type HeadersFunction,
  type MetaFunction,
  useLoaderData,
} from 'react-router'

export const meta: MetaFunction = () => [
  { title: 'JobAio | Saved Jobs' },
  { name: 'description', content: 'Your bookmarked roles in one place.' },
]

export const headers: HeadersFunction = () => ({
  'Cache-Control': 'private, max-age=0, must-revalidate',
})

export async function loader() {
  return { initialCount: 0 }
}

export default function Saved() {
  const { initialCount } = useLoaderData<typeof loader>()
  const { savedJobs } = useBookmarks()
  const count = savedJobs.length || initialCount

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden bg-muted/50 relative">
        <div className="absolute top-4 right-6 z-10">
          <span className="text-sm text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border shadow-sm">
            {count} Saved Jobs
          </span>
        </div>
        <ScrollArea className="h-full w-full">
          <div className="mx-auto max-w-3xl space-y-4 p-6 pt-12">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Saved Jobs</h1>
              <p className="text-muted-foreground">
                Your bookmarked roles in one place.
              </p>
            </div>
            {savedJobs.length > 0 ? (
              savedJobs.map((job) => <JobCard key={job.id} job={job} />)
            ) : (
              <div className="text-center text-muted-foreground mt-10">
                No saved jobs yet.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
