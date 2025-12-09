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
import { useTranslation } from 'react-i18next'

export function FilterContent({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { filters, updateFilter, resetFilters } = useFilters()

  return (
    <div className={className}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="filters-location">{t('filters.location')}</Label>
          <LocationSelector
            multiple
            id="filters-location"
            value={filters.location}
            onChange={(value) => updateFilter('location', value)}
            placeholder={t('filters.selectLocation')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="job-type">{t('filters.jobType')}</Label>
            <Select
              value={filters.jobType || 'any'}
              onValueChange={(value) =>
                updateFilter('jobType', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="job-type">
                <SelectValue placeholder={t('filters.anyJobType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('filters.any')}</SelectItem>
                {jobTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`filters.jobTypeOption.${option.value}`, {
                      defaultValue: option.label,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="experience">{t('filters.experienceLevel')}</Label>
            <Select
              value={filters.experienceLevel || 'any'}
              onValueChange={(value) =>
                updateFilter('experienceLevel', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="experience">
                <SelectValue placeholder={t('filters.anyExperience')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('filters.any')}</SelectItem>
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
            <Label htmlFor="company">{t('filters.company')}</Label>
            <Input
              id="company"
              placeholder={t('filters.companyPlaceholder')}
              value={filters.company}
              onChange={(event) => updateFilter('company', event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="industry">{t('filters.industry')}</Label>
            <Select
              value={filters.industryCategory || 'any'}
              onValueChange={(value) =>
                updateFilter('industryCategory', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="industry">
                <SelectValue placeholder={t('filters.anyIndustry')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('filters.any')}</SelectItem>
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
            <Label htmlFor="required-language">
              {t('filters.requiredLanguage')}
            </Label>
            <Select
              value={filters.requiredLanguage || 'any'}
              onValueChange={(value) =>
                updateFilter('requiredLanguage', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="required-language">
                <SelectValue placeholder={t('filters.anyLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('filters.any')}</SelectItem>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="education-level">
              {t('filters.educationLevel')}
            </Label>
            <Select
              value={filters.educationLevel || 'any'}
              onValueChange={(value) =>
                updateFilter('educationLevel', value === 'any' ? '' : value)
              }
            >
              <SelectTrigger id="education-level">
                <SelectValue placeholder={t('filters.anyEducationLevel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('filters.any')}</SelectItem>
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
            {t('filters.reset')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function FilterDialog() {
  const { t } = useTranslation()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <SlidersHorizontal className="mr-2 h-3 w-3" />
          {t('header.filters')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('filters.title')}</DialogTitle>
          <DialogDescription>{t('filters.description')}</DialogDescription>
        </DialogHeader>
        <FilterContent />
        <DialogFooter>
          <Button type="submit">{t('filters.applyFilters')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
