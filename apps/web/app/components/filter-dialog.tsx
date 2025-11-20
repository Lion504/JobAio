import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

import { useFilters } from "@/context/filter-context";

export function FilterDialog() {
  const { filters, updateFilter, resetFilters } = useFilters();

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
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              placeholder="e.g. New York, Remote" 
              value={filters.location}
              onChange={(e) => updateFilter("location", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Job Type</Label>
            <Select 
              value={filters.type} 
              onValueChange={(value) => updateFilter("type", value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="experience">Experience Level</Label>
            <Select
              value={filters.experience}
              onValueChange={(value) => updateFilter("experience", value)}
            >
              <SelectTrigger id="experience">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
                <SelectItem value="lead">Lead / Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="salary">Salary Range</Label>
            <Select
              value={filters.salary}
              onValueChange={(value) => updateFilter("salary", value)}
            >
              <SelectTrigger id="salary">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-50k">$0 - $50k</SelectItem>
                <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                <SelectItem value="100k-150k">$100k - $150k</SelectItem>
                <SelectItem value="150k+">$150k+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetFilters}>Reset</Button>
          <Button type="submit">Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
