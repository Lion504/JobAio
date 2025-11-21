import { createContext, useContext, useState, type ReactNode } from 'react'

interface FilterState {
  location: string[]
  type: string
  experience: string
  salary: string
}

interface FilterContextType {
  filters: FilterState
  setFilters: (filters: FilterState) => void
  updateFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void
  resetFilters: () => void
}

const defaultFilters: FilterState = {
  location: [],
  type: '',
  experience: '',
  salary: '',
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  return (
    <FilterContext.Provider
      value={{ filters, setFilters, updateFilter, resetFilters }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}
