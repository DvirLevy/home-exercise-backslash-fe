import { z } from 'zod'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

// Light shape check for instant feedback only; the server stays the authority on the content.
const graphFileSchema = z.object({
  nodes: z.array(z.object({ name: z.string(), kind: z.string() }).loose()),
  edges: z.array(z.unknown()),
})

export type FileCheckResult = { ok: true; suggestedName: string } | { ok: false; message: string }

export function nameFromFile(fileName: string): string {
  return fileName.replace(/\.json$/i, '').trim()
}

export async function checkGraphFile(
  file: File,
  maxBytes: number = MAX_UPLOAD_BYTES,
): Promise<FileCheckResult> {
  const looksJson = /\.json$/i.test(file.name) || file.type === 'application/json'
  if (!looksJson) return { ok: false, message: 'Only JSON files are accepted (.json).' }
  if (file.size > maxBytes) {
    return { ok: false, message: `The file is larger than ${maxBytes / 1024 / 1024} MB.` }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    return { ok: false, message: 'The file is not valid JSON.' }
  }

  const shape = graphFileSchema.safeParse(parsed)
  if (!shape.success) {
    return {
      ok: false,
      message:
        'The file must be an object with a "nodes" array (each node with a name and a kind) and an "edges" array.',
    }
  }
  return { ok: true, suggestedName: nameFromFile(file.name) }
}

export type CheckedFile = { file: File; result: FileCheckResult }
