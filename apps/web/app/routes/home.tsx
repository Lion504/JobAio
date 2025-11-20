import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobCard, type Job } from "@/components/job-card";

const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp",
    location: "Remote",
    salary: "$120k - $150k",
    type: "Full-time",
    postedAt: "2h ago",
    description:
      "We are looking for an experienced Frontend Developer to join our team. You will be responsible for building high-quality user interfaces using React and TypeScript.",
    tags: ["React", "TypeScript", "Tailwind CSS", "Next.js", "GraphQL"],
  },
  {
    id: "2",
    title: "Product Designer",
    company: "DesignStudio",
    location: "New York, NY",
    salary: "$100k - $130k",
    type: "Full-time",
    postedAt: "5h ago",
    description:
      "Join our creative team as a Product Designer. You will work closely with engineers and product managers to design intuitive and beautiful user experiences.",
    tags: ["Figma", "UI/UX", "Prototyping", "User Research"],
  },
  {
    id: "3",
    title: "Backend Engineer",
    company: "DataSystems",
    location: "San Francisco, CA",
    salary: "$130k - $160k",
    type: "Full-time",
    postedAt: "1d ago",
    description:
      "We are seeking a Backend Engineer to scale our infrastructure. Experience with Node.js, PostgreSQL, and AWS is required.",
    tags: ["Node.js", "PostgreSQL", "AWS", "Docker", "Redis"],
  },
  {
    id: "4",
    title: "Marketing Manager",
    company: "GrowthCo",
    location: "London, UK",
    salary: "£60k - £80k",
    type: "Full-time",
    postedAt: "2d ago",
    description:
      "Lead our marketing efforts and drive growth. You will be responsible for planning and executing marketing campaigns across various channels.",
    tags: ["Marketing", "SEO", "Content Strategy", "Social Media"],
  },
];

export default function Home() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden bg-muted/50 relative">
        <div className="absolute top-4 right-6 z-10">
           <span className="text-sm text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border shadow-sm">
            Showing {MOCK_JOBS.length} jobs
          </span>
        </div>
        <ScrollArea className="h-full w-full">
          <div className="mx-auto max-w-3xl space-y-4 p-6 pt-12">
            {MOCK_JOBS.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={selectedJobId === job.id}
                onClick={() => setSelectedJobId(job.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
