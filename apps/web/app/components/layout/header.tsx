import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FilterDialog } from "@/components/filter-dialog";

import { useFilters } from "@/context/filter-context";

export function Header() {
  const [open, setOpen] = useState(false);
  const { filters, updateFilter } = useFilters();

  // ... useEffect ...

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
           <Button 
             variant={filters.location === "Remote" ? "secondary" : "outline"} 
             size="sm" 
             className="h-9"
             onClick={() => updateFilter("location", filters.location === "Remote" ? "" : "Remote")}
           >
              Remote
           </Button>
           <Button 
             variant={filters.type === "full-time" ? "secondary" : "outline"} 
             size="sm" 
             className="h-9"
             onClick={() => updateFilter("type", filters.type === "full-time" ? "" : "full-time")}
           >
              Full-time
           </Button>
           <FilterDialog />
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Software Engineer</CommandItem>
            <CommandItem>Product Designer</CommandItem>
            <CommandItem>Data Scientist</CommandItem>
            <CommandItem>Frontend Developer</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
