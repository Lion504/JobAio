import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { SlidersHorizontal } from 'lucide-react'

import { useFilters } from '@/context/filter-context'
import { LocationSelector } from '@/components/location-selector'
import {
  educationLevelOptions,
  experienceLevelOptions,
  industryCategoryOptions,
  jobTypeOptions,
  languageOptions,
} from '@/data/filter-options'

export function FilterContent({ className }: { className?: string }) {
  const { filters, updateFilter, resetFilters } = useFilters()

  return (
    <div className={className}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="filters-location">Location</Label>
          <LocationSelector
            multiple
            id="filters-location"
            value={filters.location}
            onChange={(value) => updateFilter('location', value)}
            placeholder="Select location"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="job-type">Job Type</Label>
            <Select
              value={filters.jobType || 'any'}
              onValueChange={(value) =>
                updateFilter('jobType', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="job-type">
                <SelectValue placeholder="Any job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {jobTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="experience">Experience Level</Label>
            <Select
              value={filters.experienceLevel || 'any'}
              onValueChange={(value) =>
                updateFilter('experienceLevel', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="experience">
                <SelectValue placeholder="Any experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {experienceLevelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="e.g. Google"
              value={filters.company}
              onChange={(event) => updateFilter('company', event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={filters.industryCategory || 'any'}
              onValueChange={(value) =>
                updateFilter('industryCategory', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="industry">
                <SelectValue placeholder="Any industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {industryCategoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="required-language">Required Language</Label>
            <Select
              value={filters.requiredLanguage || 'any'}
              onValueChange={(value) =>
                updateFilter('requiredLanguage', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="required-language">
                <SelectValue placeholder="Any language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="education-level">Education Level</Label>
            <Select
              value={filters.educationLevel || 'any'}
              onValueChange={(value) =>
                updateFilter('educationLevel', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="education-level">
                <SelectValue placeholder="Any education level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {educationLevelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Button variant="outline" onClick={resetFilters} className="flex-1">
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}

export function FilterDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <SlidersHorizontal className="mr-2 h-3 w-3" />
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Jobs</DialogTitle>
          <DialogDescription>
            Refine your job search with specific criteria.
          </DialogDescription>
        </DialogHeader>
        <FilterContent />
        <DialogFooter>
          <Button type="submit">Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
