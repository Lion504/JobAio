import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DollarSign,
  Clock,
  Briefcase,
  Globe,
  Share2,
  Bookmark,
} from 'lucide-react'
import type { Job } from '@/types'

interface JobDetailProps {
  job: Job | null
}

export function JobDetail({ job }: JobDetailProps) {
  if (!job) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a job to view details
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex gap-4">
              <Avatar className="h-16 w-16 rounded-xl border">
                <AvatarImage src={job.logo} alt={job.company} />
                <AvatarFallback className="rounded-xl text-lg">
                  {job.company.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{job.title}</h1>
                <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {job.company}
                  </span>
                  <span>•</span>
                  <span className="text-sm">{job.location}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                Job Type
              </div>
              <div className="font-medium">{job.type}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Salary
              </div>
              <div className="font-medium">{job.salary}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Posted
              </div>
              <div className="font-medium">{job.postedAt}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                Location
              </div>
              <div className="font-medium">{job.location}</div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-semibold">
              Skills & Requirements
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About the Role</h3>
            <div className="text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t p-4">
        <Button className="w-full" size="lg">
          Apply Now
        </Button>
      </div>
    </div>
  )
}
