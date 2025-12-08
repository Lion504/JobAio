import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterContent } from '@/components/filter-dialog'
import { useFilters } from '@/context/filter-context'
import { LocationSelector } from '@/components/location-selector'

type SearchSuggestion = {
  id: string
  title: string
  company?: string
  location?: string
}

export function Header({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const { filters, updateFilter, setFilters } = useFilters()
  const [interfaceLang, setInterfaceLang] = useState<string>('en')
  const [aiSearchEnabled, setAiSearchEnabled] = useState<boolean>(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const currentSearch = searchParams.get('search') || ''

  // Track if we're syncing from URL to avoid circular updates
  const isSyncingFromUrl = useRef(false)
  // Track if filters have been initialized
  const filtersInitialized = useRef(false)

  const backendEndpoint = useMemo(
    () =>
      import.meta.env.WEB_APP_BACKEND_ENDPOINT ||
      (typeof window !== 'undefined' ? window.location.origin : ''),
    []
  )

  useEffect(() => {
    const loadPreferences = () => {
      if (typeof window === 'undefined') return
      try {
        const stored = localStorage.getItem('jobaio-preferences')
        if (stored) {
          const parsed = JSON.parse(stored) as {
            interfaceLanguage?: string
            aiSearchEnabled?: boolean
          }
          if (parsed.interfaceLanguage) {
            setInterfaceLang(parsed.interfaceLanguage)
          }
          // Default to true if not set
          setAiSearchEnabled(parsed.aiSearchEnabled !== false)
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
  }, [])

  // Sync filters from URL params on mount and when URL changes
  useEffect(() => {
    const filtersParam = searchParams.get('filters')
    isSyncingFromUrl.current = true
    if (filtersParam) {
      try {
        const parsed = JSON.parse(filtersParam)
        setFilters({
          location: parsed.location ? parsed.location.split('|') : [],
          type: parsed.job_type || '',
          experience: parsed.experience_level || '',
          salary: '',
        })
      } catch {
        // Invalid JSON, ignore
      }
    } else {
      // No filters in URL, reset to defaults
      setFilters({
        location: [],
        type: '',
        experience: '',
        salary: '',
      })
    }
    // Mark filters as initialized after first sync
    filtersInitialized.current = true
    // Reset the syncing flag after a tick
    setTimeout(() => {
      isSyncingFromUrl.current = false
    }, 0)
  }, [searchParams, setFilters])

  // Build URL params for navigation
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
      if (currentFilters.type) {
        filtersPayload.job_type = currentFilters.type
      }
      if (currentFilters.experience) {
        filtersPayload.experience_level = currentFilters.experience
      }

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

  // Auto-apply filters when they change (outside of URL sync)
  useEffect(() => {
    // Skip if we're syncing from URL or filters haven't been initialized yet
    if (isSyncingFromUrl.current || !filtersInitialized.current) {
      return
    }

    // Debounce the navigation slightly
    const timeout = setTimeout(() => {
      const params = buildNavigationParams(currentSearch, filters)
      const newUrl = params.toString() ? `/?${params.toString()}` : '/'
      navigate(newUrl)
    }, 150)

    return () => clearTimeout(timeout)
  }, [filters, currentSearch, navigate, buildNavigationParams])

  // Initialize search query when dialog opens
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
        const apiUrl = new URL('/api/jobs/suggestions', backendEndpoint)
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((job: any, index: number) => ({
            id: String(
              job._id ??
                job.id ??
                job.job_id ??
                `${job.title ?? 'job'}-${index}`
            ),
            title: job.title ?? 'Untitled role',
            company: job.company ?? 'Unknown company',
            location: job.location ?? 'Remote',
          }))

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
  }, [open, searchQuery, backendEndpoint, interfaceLang])

  const handleSearch = (term?: string) => {
    setOpen(false)
    const query = term || searchQuery
    if (query.trim()) {
      const params = buildNavigationParams(query, filters)
      navigate(`/?${params.toString()}`)
    }
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      {children}
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
            {currentSearch || 'Search for jobs...'}
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
              placeholder="Search cities or Remote work"
              buttonClassName="h-9 justify-between overflow-hidden"
              prefixIcon={
                <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              }
            />
          </div>
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) =>
              updateFilter('type', value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogTitle className="sr-only">Search and Filters</DialogTitle>
          <div className="flex h-[600px] flex-col md:h-[450px] md:flex-row">
            <div className="flex-1 border-b md:border-b-0 md:border-r">
              <Command className="h-full w-full rounded-none border-none">
                <CommandInput
                  placeholder="Type a command or search..."
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
                      ? 'Type at least 2 characters to search.'
                      : isLoadingSuggestions
                        ? 'Searching...'
                        : 'No results found.'}
                  </CommandEmpty>
                  {suggestions.length > 0 && (
                    <CommandGroup heading="Suggestions">
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
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
              </div>
              <FilterContent />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
