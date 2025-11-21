import { JobCard } from '@/components/job-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBookmarks } from '@/context/bookmarks-context'

export default function Saved() {
  const { savedJobs } = useBookmarks()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Saved Jobs</h1>
        <span className="text-sm text-muted-foreground">
          {savedJobs.length} jobs
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
