import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MapPin } from 'lucide-react'

export function Header() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { filters, updateFilter } = useFilters()
  const navigate = useNavigate()

  const handleSearch = (term?: string) => {
    setOpen(false)
    const query = term || searchQuery
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query)}`)
    }
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        <Button
          variant="outline"
          className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:w-64 lg:w-80"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          Search for jobs...
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <div className="hidden items-center gap-2 md:flex">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 w-[180px] justify-start overflow-hidden"
              >
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {filters.location || 'Location'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search location..." />
                <CommandList>
                  <CommandEmpty>No location found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => updateFilter('location', 'Remote')}
                    >
                      Remote
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        updateFilter('location', 'Helsinki, Finland')
                      }
                    >
                      Helsinki, Finland
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        updateFilter('location', 'Espoo, Finland')
                      }
                    >
                      Espoo, Finland
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        updateFilter('location', 'Tampere, Finland')
                      }
                    >
                      Tampere, Finland
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        updateFilter('location', 'Turku, Finland')
                      }
                    >
                      Turku, Finland
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

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
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    <CommandItem
                      onSelect={() => handleSearch('Software Engineer')}
                    >
                      Software Engineer
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSearch('Product Designer')}
                    >
                      Product Designer
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSearch('Data Scientist')}
                    >
                      Data Scientist
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSearch('Frontend Developer')}
                    >
                      Frontend Developer
                    </CommandItem>
                  </CommandGroup>
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
