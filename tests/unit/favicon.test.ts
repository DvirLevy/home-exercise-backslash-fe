import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('favicon', () => {
  it('ships the Backslash favicon and links it from index.html', () => {
    const root = resolve(import.meta.dirname, '../..')
    expect(existsSync(resolve(root, 'public/favicon.png'))).toBe(true)
    expect(readFileSync(resolve(root, 'index.html'), 'utf8')).toMatch(
      /<link rel="icon"[^>]*href="\/favicon\.png"/,
    )
  })
})
