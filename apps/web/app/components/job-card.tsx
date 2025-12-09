import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Globe,
  GraduationCap,
  Code,
  Users,
  Award,
  Bookmark,
  ExternalLink,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { useBookmarks } from '@/context/bookmarks-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Job } from '@/types'

interface JobCardProps {
  job: Job
  isSelected?: boolean
  onClick?: () => void
}

function getExperienceBadgeColor(level: string) {
  const levelLower = level.toLowerCase()
  if (levelLower.includes('entry') || levelLower.includes('junior'))
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
  if (levelLower.includes('mid') || levelLower.includes('intermediate'))
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
  if (levelLower.includes('senior') || levelLower.includes('lead'))
    return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
  return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30'
}

function formatDate(dateString: string): string {
  if (!dateString) return ''

  if (dateString.includes('T') || dateString.includes('-')) {
    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      }
    } catch {}
  }

  return dateString
}

function getJobTypeBadgeColor(type: string) {
  const typeLower = type.toLowerCase()
  if (typeLower.includes('full'))
    return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
  if (typeLower.includes('part'))
    return 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30'
  if (typeLower.includes('contract') || typeLower.includes('freelance'))
    return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30'
  if (typeLower.includes('intern'))
    return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'
  if (typeLower.includes('remote'))
    return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30'
  return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30'
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks()
  const bookmarked = isBookmarked(job.id)

  const skillType = {
    technical: job.skillType?.technical ?? [],
    domainSpecific: job.skillType?.domainSpecific ?? [],
    certifications: job.skillType?.certifications ?? [],
    softSkills: job.skillType?.softSkills ?? [],
    other: job.skillType?.other ?? [],
  }

  const jobTypes = job.jobTypes ?? []
  const educationLevels = job.educationLevels ?? []
  const languagesRequired = job.languagesRequired ?? []
  const languagesAdvantage = job.languagesAdvantage ?? []
  const responsibilities = job.responsibilities ?? []
  const tags = job.tags ?? []

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

  const hasSkills =
    skillType.technical.length > 0 ||
    skillType.domainSpecific.length > 0 ||
    skillType.certifications.length > 0 ||
    skillType.softSkills.length > 0 ||
    skillType.other.length > 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card
        className="w-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 bg-card"
        onClick={handleCardClick}
      >
        <CardHeader className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Job info */}
            <div className="min-w-0 flex-1 space-y-2">
              {/* Title row */}
              <div className="flex items-start gap-2">
                <h3 className="font-semibold text-base leading-tight line-clamp-2">
                  {job.title}
                </h3>
              </div>

              {/* Company and date row */}
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">
                    {job.company}
                  </span>
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(job.postedAt)}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 hover:bg-amber-500/10',
                  bookmarked && 'text-amber-500'
                )}
                onClick={handleBookmark}
              >
                <Bookmark
                  className={cn('h-4 w-4', bookmarked && 'fill-current')}
                />
                <span className="sr-only">Bookmark</span>
              </Button>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-3">
          {/* Meta info row with visual indicators */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Location */}
            <Badge
              variant="outline"
              className="gap-1 bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30"
            >
              <MapPin className="h-3 w-3" />
              {job.location}
            </Badge>

            {/* Job Type */}
            <Badge
              variant="outline"
              className={cn('gap-1', getJobTypeBadgeColor(job.type))}
            >
              <Clock className="h-3 w-3" />
              {job.type}
            </Badge>

            {/* Experience Level */}
            <Badge
              variant="outline"
              className={cn(
                'gap-1',
                getExperienceBadgeColor(job.experienceLevel)
              )}
            >
              <Briefcase className="h-3 w-3" />
              {job.experienceLevel}
            </Badge>

            {/* Languages */}
            {languagesRequired.length > 0 && (
              <Badge
                variant="outline"
                className="gap-1 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
              >
                <Globe className="h-3 w-3" />
                {languagesRequired.slice(0, 2).join(', ')}
                {languagesRequired.length > 2 &&
                  ` +${languagesRequired.length - 2}`}
              </Badge>
            )}
          </div>

          {/* Tags row */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs font-normal px-2 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > 4 && (
                <Badge
                  variant="secondary"
                  className="text-xs font-normal px-2 py-0.5"
                >
                  +{tags.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Expanded Content */}
          <CollapsibleContent
            className="pt-3 border-t space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
                <TabsTrigger value="overview" className="text-xs px-3 py-1.5">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-xs px-3 py-1.5">
                  Skills
                </TabsTrigger>
                <TabsTrigger
                  value="requirements"
                  className="text-xs px-3 py-1.5"
                >
                  Requirements
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs px-3 py-1.5">
                  Details
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Responsibilities */}
                {responsibilities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      Responsibilities
                    </h4>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {responsibilities.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="space-y-4">
                {hasSkills ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SkillGroup
                      title="Technical Skills"
                      items={skillType.technical}
                      icon={<Code className="h-3.5 w-3.5" />}
                      colorClass="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                    />
                    <SkillGroup
                      title="Domain Knowledge"
                      items={skillType.domainSpecific}
                      icon={<Sparkles className="h-3.5 w-3.5" />}
                      colorClass="bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30"
                    />
                    <SkillGroup
                      title="Certifications"
                      items={skillType.certifications}
                      icon={<Award className="h-3.5 w-3.5" />}
                      colorClass="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                    />
                    <SkillGroup
                      title="Soft Skills"
                      items={skillType.softSkills}
                      icon={<Users className="h-3.5 w-3.5" />}
                      colorClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    />
                    {skillType.other.length > 0 && (
                      <SkillGroup
                        title="Other Skills"
                        items={skillType.other}
                        icon={<Briefcase className="h-3.5 w-3.5" />}
                        colorClass="bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30"
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No specific skills listed for this position.
                  </p>
                )}
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Languages */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      Languages
                    </h4>
                    <div className="space-y-2">
                      {languagesRequired.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {languagesRequired.map((lang) => (
                            <Badge
                              key={lang}
                              variant="outline"
                              className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                            >
                              ✓ {lang}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No required languages specified
                        </span>
                      )}
                      {languagesAdvantage.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {languagesAdvantage.map((lang) => (
                            <Badge
                              key={lang}
                              variant="outline"
                              className="text-xs bg-muted/50"
                            >
                              + {lang}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Education
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {educationLevels.length > 0 ? (
                        educationLevels.map((level) => (
                          <Badge
                            key={level}
                            variant="outline"
                            className="text-xs bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30"
                          >
                            {level}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not specified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      Experience Level
                    </h4>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        getExperienceBadgeColor(job.experienceLevel)
                      )}
                    >
                      {job.experienceLevel}
                    </Badge>
                  </div>

                  {/* Job Types */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Employment Type
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {jobTypes.length > 0 ? (
                        jobTypes.map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className={cn(
                              'text-xs',
                              getJobTypeBadgeColor(type)
                            )}
                          >
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            getJobTypeBadgeColor(job.type)
                          )}
                        >
                          {job.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <InfoCard
                    label="Location"
                    value={job.location}
                    icon={<MapPin className="h-3.5 w-3.5" />}
                  />
                  <InfoCard
                    label="Industry"
                    value={job.industryCategory || 'Not specified'}
                    icon={<Building2 className="h-3.5 w-3.5" />}
                  />
                  <InfoCard
                    label="Posted"
                    value={formatDate(job.postedAt)}
                    icon={<Calendar className="h-3.5 w-3.5" />}
                  />
                  {job.updatedAt && (
                    <InfoCard
                      label="Updated"
                      value={formatDate(job.updatedAt)}
                      icon={<Calendar className="h-3.5 w-3.5" />}
                    />
                  )}
                  {job.source && (
                    <InfoCard
                      label="Source"
                      value={job.source}
                      icon={<ExternalLink className="h-3.5 w-3.5" />}
                    />
                  )}
                </div>

                {/* Extra tags */}
                {tags.length > 4 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      All Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* View listing button */}
            <div className="flex justify-end pt-2 border-t">
              {job.link ? (
                <Button size="sm" className="gap-2" asChild>
                  <a href={job.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Original Listing
                    {job.source && (
                      <span className="text-xs opacity-70">({job.source})</span>
                    )}
                  </a>
                </Button>
              ) : (
                <Button size="sm" disabled className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
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

function SkillGroup({
  title,
  items,
  icon,
  colorClass,
}: {
  title: string
  items: string[]
  icon: React.ReactNode
  colorClass: string
}) {
  if (items.length === 0) return null

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        {icon}
        {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge
            key={item}
            variant="outline"
            className={cn('text-xs', colorClass)}
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium truncate" title={value}>
        {value}
      </div>
    </div>
  )
}
