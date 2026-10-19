/** Read-only JSON, used for the `extra` and `metadata` objects the API passes through. */
export function JsonView({ value }: { value: unknown }) {
  return (
    <pre className="bg-muted overflow-auto rounded-md border p-2 font-mono text-[11.5px] whitespace-pre-wrap">
      {value === null || value === undefined ? 'null' : JSON.stringify(value, null, 2)}
    </pre>
  )
}
