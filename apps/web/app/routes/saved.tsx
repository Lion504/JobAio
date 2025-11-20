import { JobCard, type Job } from "@/components/job-card";
import { ScrollArea } from "@/components/ui/scroll-area";

const SAVED_JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "TechCorp",
    location: "Remote",
    type: "Full-time",
    salary: "$120k - $150k",
    postedAt: "2 days ago",
    description:
      "We are looking for an experienced Frontend Engineer to join our team...",
    tags: ["React", "TypeScript", "Tailwind"],
    logo: "https://github.com/shadcn.png",
  },
  {
    id: "3",
    title: "Product Designer",
    company: "DesignStudio",
    location: "New York, NY",
    type: "Full-time",
    salary: "$100k - $130k",
    postedAt: "1 week ago",
    description:
      "Join our award-winning design team and help shape the future of our products...",
    tags: ["Figma", "UI/UX", "Prototyping"],
    logo: "https://github.com/shadcn.png",
  },
];

export default function Saved() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Saved Jobs</h1>
        <span className="text-sm text-muted-foreground">
          {SAVED_JOBS.length} jobs
        </span>
      </div>
      <div className="flex flex-1 overflow-hidden bg-muted/50">
        <ScrollArea className="h-full w-full">
          <div className="mx-auto max-w-3xl space-y-4 p-6">
            {SAVED_JOBS.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
