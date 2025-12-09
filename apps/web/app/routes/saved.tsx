import { JobCard } from '@/components/job-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBookmarks } from '@/context/bookmarks-context'
import { type HeadersFunction, type LoaderFunctionArgs, type MetaFunction, useLoaderData } from 'react-router'

export const meta: MetaFunction = () => [
  { title: 'JobAio | Saved Jobs' },
  { name: 'description', content: 'Your bookmarked roles in one place.' },
]

export const headers: HeadersFunction = () => ({
  'Cache-Control': 'private, max-age=0, must-revalidate',
})

export async function loader(_args: LoaderFunctionArgs) {
  return { initialCount: 0 }
}

export default function Saved() {
  const { initialCount } = useLoaderData<typeof loader>()
  const { savedJobs } = useBookmarks()
  const count = savedJobs.length || initialCount

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Saved Jobs</h1>
        <span className="text-sm text-muted-foreground">
          {count} jobs
        </span>
      </div>
      <div className="flex flex-1 overflow-hidden bg-muted/50">
        <ScrollArea className="h-full w-full">
          <div className="mx-auto max-w-3xl space-y-4 p-6">
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
