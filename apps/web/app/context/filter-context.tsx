import { createContext, useContext, useState, type ReactNode } from "react";

interface FilterState {
  location: string;
  type: string;
  experience: string;
  salary: string;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  location: "",
  type: "",
  experience: "",
  salary: "",
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <FilterContext.Provider
      value={{ filters, setFilters, updateFilter, resetFilters }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
