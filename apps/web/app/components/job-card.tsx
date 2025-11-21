import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, DollarSign, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import { useBookmarks } from '@/context/bookmarks-context'

export interface Job {
  id: string
  title: string
  company: string
  logo?: string
  location: string
  salary: string
  type: string
  postedAt: string
  description: string
  tags: string[]
  link?: string
}

interface JobCardProps {
  job: Job
  isSelected?: boolean
  onClick?: () => void
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks()
  const bookmarked = isBookmarked(job.id)

  const handleCardClick = () => {
    if (onClick) onClick()
    setIsOpen(!isOpen)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bookmarked) {
      removeBookmark(job.id)
    } else {
      addBookmark(job)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isSelected ? 'border-primary bg-primary/5' : 'bg-card'
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
          <Avatar className="h-12 w-12 rounded-lg border">
            <AvatarImage src={job.logo} alt={job.company} />
            <AvatarFallback className="rounded-lg">
              {job.company.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {job.title}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {job.postedAt}
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {job.company}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleBookmark}
            >
              <Bookmark
                className={cn('h-4 w-4', bookmarked && 'fill-current')}
              />
              <span className="sr-only">Bookmark</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {job.salary}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {job.type}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {job.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
          <CollapsibleContent className="mt-4 space-y-4 border-t pt-4">
            <div className="text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border p-2">
                <div className="text-xs text-muted-foreground">Job Type</div>
                <div className="text-sm font-medium">{job.type}</div>
              </div>
              <div className="rounded-lg border p-2">
                <div className="text-xs text-muted-foreground">Salary</div>
                <div className="text-sm font-medium">{job.salary}</div>
              </div>
              <div className="rounded-lg border p-2">
                <div className="text-xs text-muted-foreground">Posted</div>
                <div className="text-sm font-medium">{job.postedAt}</div>
              </div>
              <div className="rounded-lg border p-2">
                <div className="text-xs text-muted-foreground">Location</div>
                <div className="text-sm font-medium">{job.location}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {job.tags.slice(3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              {job.link ? (
                <Button className="w-full sm:w-auto" asChild>
                  <a href={job.link} target="_blank" rel="noopener noreferrer">
                    View Listing
                  </a>
                </Button>
              ) : (
                <Button className="w-full sm:w-auto" disabled>
                  Link unavailable
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}
