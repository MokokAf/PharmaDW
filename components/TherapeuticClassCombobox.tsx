'use client'

import { useCallback, useMemo, useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { TherapeuticClassOption } from '@/types/medication'

const TOP_N = 15

interface TherapeuticClassComboboxProps {
  options: TherapeuticClassOption[]
  value: string
  onValueChange: (value: string) => void
}

export function TherapeuticClassCombobox({
  options,
  value,
  onValueChange,
}: TherapeuticClassComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const popular = useMemo(
    () => [...options].sort((a, b) => b.count - a.count).slice(0, TOP_N),
    [options]
  )

  const selectedLabel = useMemo(
    () => options.find((o) => o.label === value)?.label ?? '',
    [options, value]
  )

  const handleSelect = useCallback(
    (label: string) => {
      onValueChange(label === value ? '' : label)
      setOpen(false)
      setSearch('')
    },
    [onValueChange, value]
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onValueChange('')
      setSearch('')
    },
    [onValueChange]
  )

  const hasSearch = search.trim().length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 font-normal"
        >
          <span className="truncate text-left">
            {value ? selectedLabel : 'Classe thérapeutique'}
          </span>
          <span className="flex items-center gap-1 shrink-0 ml-2">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => { if (e.key === 'Enter') handleClear(e as unknown as React.MouseEvent) }}
                className="rounded-sm opacity-50 hover:opacity-100"
                aria-label="Effacer le filtre"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Rechercher une classe..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Aucune classe trouvée.</CommandEmpty>

            {/* Popular classes — shown only when not searching */}
            {!hasSearch && (
              <>
                <CommandGroup heading="Populaires">
                  {popular.map((opt) => (
                    <CommandItem
                      key={`pop-${opt.label}`}
                      value={opt.label}
                      onSelect={() => handleSelect(opt.label)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          value === opt.label ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="truncate">{opt.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {opt.count}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* All classes (alphabetical, or filtered by search) */}
            <CommandGroup heading={hasSearch ? 'Résultats' : 'Toutes les classes'}>
              {options.map((opt) => (
                <CommandItem
                  key={opt.label}
                  value={opt.label}
                  onSelect={() => handleSelect(opt.label)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === opt.label ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {opt.count}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
