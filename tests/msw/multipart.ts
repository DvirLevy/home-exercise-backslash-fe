export type Multipart = {
  fields: Record<string, string>
  files: Record<string, { filename: string; content: string }>
}

/**
 * Reads a multipart/form-data request from raw text. `request.formData()` cannot be used in
 * jsdom tests: jsdom's File is not the File class undici's parser expects.
 */
export async function readMultipart(request: Request): Promise<Multipart> {
  const contentType = request.headers.get('content-type') ?? ''
  const boundary = /boundary=(.+)$/.exec(contentType)?.[1]
  if (!boundary) throw new Error(`Not a multipart request: ${contentType}`)

  const result: Multipart = { fields: {}, files: {} }
  for (const part of (await request.text()).split(`--${boundary}`)) {
    const split = part.indexOf('\r\n\r\n')
    if (split === -1) continue
    const head = part.slice(0, split)
    const body = part.slice(split + 4).replace(/\r\n$/, '')
    const name = /name="([^"]+)"/.exec(head)?.[1]
    if (!name) continue
    const filename = /filename="([^"]*)"/.exec(head)?.[1]
    if (filename === undefined) result.fields[name] = body
    else result.files[name] = { filename, content: body }
  }
  return result
}
