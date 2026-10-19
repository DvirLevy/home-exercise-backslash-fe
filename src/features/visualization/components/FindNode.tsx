import { Command } from 'cmdk'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

const MAX_RESULTS = 8

type Props = { names: string[]; onPick: (name: string) => void }

/** Search box that lists matching node names and hands the chosen one to `onPick`. */
export function FindNode({ names, onPick }: Props) {
  const [query, setQuery] = useState('')
  const trimmed = query.trim().toLowerCase()
  const matches = useMemo(
    () =>
      trimmed === ''
        ? []
        : names.filter((n) => n.toLowerCase().includes(trimmed)).slice(0, MAX_RESULTS),
    [names, trimmed],
  )

  return (
    <Command label="Find a node" shouldFilter={false} className="relative w-56">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-2 left-2 size-4"
        aria-hidden
      />
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Find a node…"
        aria-label="Find a node"
        className="bg-card placeholder:text-muted-foreground h-8 w-full rounded-md border border-input pr-2 pl-8 text-sm"
      />
      {trimmed !== '' ? (
        <Command.List className="bg-card absolute top-9 right-0 left-0 z-10 max-h-64 overflow-auto rounded-md border p-1 shadow-md">
          {matches.length === 0 ? (
            <div className="text-muted-foreground px-2 py-1.5 text-[13px]">No node matches</div>
          ) : null}
          {matches.map((name) => (
            <Command.Item
              key={name}
              value={name}
              onSelect={() => {
                onPick(name)
                setQuery('')
              }}
              className="data-[selected=true]:bg-muted cursor-pointer truncate rounded px-2 py-1.5 text-[13px]"
            >
              {name}
            </Command.Item>
          ))}
        </Command.List>
      ) : null}
    </Command>
  )
}
