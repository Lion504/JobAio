'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cities } from '@/data/cities'

interface LocationSelectorSharedProps {
  id?: string
  placeholder?: string
  buttonClassName?: string
  prefixIcon?: React.ReactNode
}

interface LocationSelectorSingleProps extends LocationSelectorSharedProps {
  multiple?: false
  value?: string
  onChange: (value: string) => void
}

interface LocationSelectorMultiProps extends LocationSelectorSharedProps {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
}

export type LocationSelectorProps =
  | LocationSelectorSingleProps
  | LocationSelectorMultiProps

function isMultiProps(
  props: LocationSelectorProps
): props is LocationSelectorMultiProps {
  return Boolean(props.multiple)
}

export function LocationSelector(props: LocationSelectorProps) {
  const {
    id,
    placeholder = 'Select location...',
    buttonClassName,
    prefixIcon,
  } = props
  const [open, setOpen] = React.useState(false)
  const isMulti = isMultiProps(props)

  const sortedCities = React.useMemo(() => {
    if (isMulti) {
      const selections = (props.value ?? []) as string[]
      if (selections.length === 0) {
        return cities
      }

      const seen = new Set<string>()
      const orderedSelections: string[] = []

      for (const city of selections) {
        if (!cities.includes(city) || seen.has(city)) continue
        seen.add(city)
        orderedSelections.push(city)
      }

      if (orderedSelections.length === 0) {
        return cities
      }

      const remaining = cities.filter((city) => !seen.has(city))
      return [...orderedSelections, ...remaining]
    }

    const selection = (props.value ?? '') as string
    if (selection && cities.includes(selection)) {
      return [selection, ...cities.filter((city) => city !== selection)]
    }

    return cities
  }, [isMulti, props.value])

  let displayValue = placeholder
  let isSelected = (city: string) => false
  let handleSelect = (_city: string) => undefined

  if (isMulti) {
    const selections = props.value
    displayValue =
      selections.length === 0
        ? placeholder
        : selections.length === 1
          ? selections[0]
          : `${selections[0]} +${selections.length - 1}`
    isSelected = (city) => selections.includes(city)
    handleSelect = (city) => {
      const exists = selections.includes(city)
      const next = exists
        ? selections.filter((item) => item !== city)
        : [...selections, city]
      props.onChange(next)
    }
  } else {
    const selection = props.value ?? ''
    displayValue =
      selection && cities.includes(selection)
        ? selection
        : selection || placeholder
    isSelected = (city) => selection === city
    handleSelect = (city) => {
      const nextValue = selection === city ? '' : city
      props.onChange(nextValue)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', buttonClassName)}
        >
          <span className="flex min-w-0 items-center gap-2">
            {prefixIcon}
            <span className="truncate text-left">{displayValue}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder="Search location..." />
          <CommandList>
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup>
              {sortedCities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => handleSelect(city)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      isSelected(city) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
