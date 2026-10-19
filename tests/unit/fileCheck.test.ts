import { checkGraphFile, nameFromFile } from '@/features/graph/utils/fileCheck'

const json = (content: unknown, name = 'g.json', type = 'application/json') =>
  new File([typeof content === 'string' ? content : JSON.stringify(content)], name, { type })

describe('checkGraphFile', () => {
  it('accepts a graph file and suggests a name from the file name', async () => {
    const r = await checkGraphFile(
      json({ nodes: [{ name: 'a', kind: 'service', extra: 1 }], edges: [] }, 'train-ticket.json'),
    )
    expect(r).toEqual({ ok: true, suggestedName: 'train-ticket' })
  })

  it('rejects files that are not JSON by name or type', async () => {
    const r = await checkGraphFile(json('x', 'notes.txt', 'text/plain'))
    expect(r).toMatchObject({ ok: false, message: expect.stringMatching(/JSON/) })
  })

  it('rejects files over the size limit', async () => {
    const r = await checkGraphFile(json({ nodes: [], edges: [] }), 5)
    expect(r).toMatchObject({ ok: false, message: expect.stringMatching(/larger/) })
  })

  it('rejects invalid JSON', async () => {
    expect(await checkGraphFile(json('{nope'))).toMatchObject({
      ok: false,
      message: 'The file is not valid JSON.',
    })
  })

  it('rejects the wrong shape', async () => {
    expect(await checkGraphFile(json({ nodes: [] }))).toMatchObject({ ok: false })
    expect(await checkGraphFile(json({ nodes: [{ name: 'a' }], edges: [] }))).toMatchObject({
      ok: false,
    })
  })
})

describe('nameFromFile', () => {
  it('drops the .json extension case-insensitively', () => {
    expect(nameFromFile('My Graph.JSON')).toBe('My Graph')
  })
})
