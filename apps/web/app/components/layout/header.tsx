import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router'
import { Search, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FilterContent } from '@/components/filter-dialog'
import { defaultFilters, useFilters } from '@/context/filter-context'
import { LocationSelector } from '@/components/location-selector'
import { type SearchSuggestion, type ApiJob } from '@/types'
import { getApiUrl } from '@/lib/api'
import { jobTypeOptions } from '@/data/filter-options'
import { useTranslation } from 'react-i18next'

export function Header({ children }: { children?: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const { filters, updateFilter, setFilters } = useFilters()
  const interfaceLang = i18n.language

  const [searchParams] = useSearchParams()
  const [aiSearchEnabled, setAiSearchEnabled] = useState<boolean>(
    searchParams.get('ai') === 'true'
  )
  const navigate = useNavigate()
  const location = useLocation()

  const currentSearch = searchParams.get('search') || ''

  const isSyncingFromUrl = useRef(false)
  const filtersInitialized = useRef(false)
  const showSearch = !location.pathname.startsWith('/suggestions')

  useEffect(() => {
    const loadPreferences = () => {
      if (typeof window === 'undefined') return
      try {
        const stored = localStorage.getItem('jobaio-preferences')
        if (stored) {
          const parsed = JSON.parse(stored) as {
            interfaceLanguage?: string
          }
          if (
            parsed.interfaceLanguage &&
            parsed.interfaceLanguage !== i18n.language
          ) {
            i18n.changeLanguage(parsed.interfaceLanguage)
            localStorage.setItem(
              'jobaio-preferences-lang',
              parsed.interfaceLanguage
            )
          }
        }
      } catch (error) {
        console.error('Failed to read preferences from localStorage', error)
      }
    }

    loadPreferences()

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'jobaio-preferences') {
        loadPreferences()
      }
    }
    const onCustomUpdate = () => loadPreferences()

    window.addEventListener('storage', onStorage)
    window.addEventListener('preferences-updated', onCustomUpdate)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('preferences-updated', onCustomUpdate)
    }
  }, [i18n])

  useEffect(() => {
    setAiSearchEnabled(searchParams.get('ai') === 'true')
  }, [searchParams])

  useEffect(() => {
    const currentLang = searchParams.get('lang')
    if (interfaceLang && currentLang !== interfaceLang) {
      const params = new URLSearchParams(searchParams)
      params.set('lang', interfaceLang)
      navigate(`${location.pathname}?${params.toString()}`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interfaceLang])

  useEffect(() => {
    const filtersParam = searchParams.get('filters')
    isSyncingFromUrl.current = true
    if (filtersParam) {
      try {
        const parsed = JSON.parse(filtersParam)
        setFilters({
          location: parsed.location ? String(parsed.location).split('|') : [],
          jobType: parsed.job_type || '',
          experienceLevel: parsed.experience_level || '',
          company: parsed.company || '',
          industryCategory: parsed.industry_category || '',
          requiredLanguage: parsed.required_language || '',
          educationLevel: parsed.education_level || '',
        })
      } catch {
        setFilters({ ...defaultFilters })
      }
    } else {
      setFilters({ ...defaultFilters })
    }
    filtersInitialized.current = true
    setTimeout(() => {
      isSyncingFromUrl.current = false
    }, 0)
  }, [searchParams, setFilters])

  const buildNavigationParams = useCallback(
    (search: string, currentFilters: typeof filters) => {
      const params = new URLSearchParams()

      if (search.trim()) {
        params.set('search', search.trim())
      }

      const filtersPayload: Record<string, string> = {}
      if (currentFilters.location.length > 0) {
        filtersPayload.location = currentFilters.location.join('|')
      }
      const appendIfPresent = (key: string, value: string) => {
        const trimmed = value.trim()
        if (trimmed) {
          filtersPayload[key] = trimmed
        }
      }

      appendIfPresent('job_type', currentFilters.jobType)
      appendIfPresent('experience_level', currentFilters.experienceLevel)
      appendIfPresent('company', currentFilters.company)
      appendIfPresent('industry_category', currentFilters.industryCategory)
      appendIfPresent('required_language', currentFilters.requiredLanguage)
      appendIfPresent('education_level', currentFilters.educationLevel)

      if (Object.keys(filtersPayload).length > 0) {
        params.set('filters', JSON.stringify(filtersPayload))
      }

      if (interfaceLang) {
        params.set('lang', interfaceLang)
      }

      if (aiSearchEnabled) {
        params.set('ai', 'true')
      }

      return params
    },
    [interfaceLang, aiSearchEnabled]
  )

  useEffect(() => {
    if (isSyncingFromUrl.current || !filtersInitialized.current) {
      return
    }

    const timeout = setTimeout(() => {
      const params = buildNavigationParams(currentSearch, filters)
      const newUrl = params.toString() ? `/?${params.toString()}` : '/'
      navigate(newUrl)
    }, 150)

    return () => clearTimeout(timeout)
  }, [filters, currentSearch, navigate, buildNavigationParams])

  useEffect(() => {
    if (open) {
      setSearchQuery(currentSearch)
    }
  }, [open, currentSearch])

  useEffect(() => {
    if (!open || searchQuery.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true)
        const apiUrl = getApiUrl('/api/jobs/suggestions')
        apiUrl.searchParams.set('q', searchQuery)
        apiUrl.searchParams.set('limit', '8')
        apiUrl.searchParams.set('lang', interfaceLang || 'en')

        const res = await fetch(apiUrl, { signal: controller.signal })
        if (!res.ok) {
          throw new Error('Failed to fetch job suggestions')
        }

        const data = await res.json()
        const source = Array.isArray(data) ? data : data?.suggestions || []
        const mapped: SearchSuggestion[] = source
          .slice(0, 8)
          .map(
            (
              job: Partial<ApiJob> & { id?: string; job_id?: string },
              index: number
            ) => ({
              id: String(
                job._id ??
                  job.id ??
                  job.job_id ??
                  `${job.title ?? 'job'}-${index}`
              ),
              title: job.title ?? 'Untitled role',
              company: job.company ?? 'Unknown company',
              location: job.location ?? 'Remote',
            })
          )

        setSuggestions(mapped)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        console.error('Failed to fetch job suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [open, searchQuery, interfaceLang])

  const handleSearch = (term?: string) => {
    setOpen(false)
    const query = term || searchQuery
    if (query.trim()) {
      const params = buildNavigationParams(query, filters)
      navigate(`/?${params.toString()}`)
    }
  }

  return (
    <header
      className={`flex h-14 items-center gap-4 border-b bg-background px-6 ${
        !showSearch ? 'lg:hidden' : ''
      }`}
    >
      {children}
      {showSearch && (
        <>
          <div className="flex flex-1 items-center gap-4">
            <Button
              variant="outline"
              className={`relative h-9 w-full justify-start text-sm sm:w-64 lg:w-80 ${
                currentSearch ? 'text-foreground' : 'text-muted-foreground'
              }`}
              onClick={() => setOpen(true)}
            >
              <Search className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {currentSearch || t('common.searchPlaceholder')}
              </span>
              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            <div className="hidden items-center gap-2 md:flex">
              <div className="w-[200px]">
                <LocationSelector
                  multiple
                  value={filters.location}
                  onChange={(value) => updateFilter('location', value)}
                  placeholder={t('preferences.preferredLocations')}
                  buttonClassName="h-9 justify-between overflow-hidden"
                  prefixIcon={
                    <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  }
                />
              </div>
              <Select
                value={filters.jobType || 'any'}
                onValueChange={(value) =>
                  updateFilter('jobType', value === 'any' ? '' : value)
                }
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder={t('filters.jobType')} />
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
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl overflow-hidden p-0">
              <DialogTitle className="sr-only">Search and Filters</DialogTitle>
              <DialogDescription className="sr-only">
                Search jobs and adjust filters in this dialog.
              </DialogDescription>
              <div className="flex h-[600px] flex-col md:h-[450px] md:flex-row">
                <div className="flex-1 border-b md:border-b-0 md:border-r">
                  <Command className="h-full w-full rounded-none border-none">
                    <CommandInput
                      placeholder={t('header.commandPlaceholder')}
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch()
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchQuery.trim().length < 2
                          ? t('header.typeToSearch')
                          : isLoadingSuggestions
                            ? t('header.searching')
                            : t('header.noResults')}
                      </CommandEmpty>
                      {suggestions.length > 0 && (
                        <CommandGroup heading={t('header.suggestions')}>
                          {suggestions.map((suggestion) => (
                            <CommandItem
                              key={suggestion.id}
                              value={suggestion.title}
                              onSelect={() => handleSearch(suggestion.title)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {suggestion.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {suggestion.company}
                                  {suggestion.location
                                    ? ` • ${suggestion.location}`
                                    : ''}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </div>
                <div className="w-full overflow-y-auto bg-card p-6 md:w-[320px]">
                  <div className="mb-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">
                        {t('header.filters')}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <Label
                          htmlFor="ai-search-toggle"
                          className="text-sm font-medium"
                        >
                          {t('header.aiQueryExpansion')}
                        </Label>
                        <Switch
                          id="ai-search-toggle"
                          checked={aiSearchEnabled}
                          onCheckedChange={setAiSearchEnabled}
                          aria-label="Toggle AI query expansion"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('header.aiQueryDescription')}
                    </p>
                  </div>
                  <FilterContent />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </header>
  )
}
