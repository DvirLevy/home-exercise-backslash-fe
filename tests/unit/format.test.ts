import { formatBytes, formatRelativeTime, pluralize } from '@/utils/format'

describe('format', () => {
  const now = new Date('2026-10-19T12:00:00Z')

  it('formats relative times', () => {
    expect(formatRelativeTime('2026-10-19T11:58:00Z', now)).toBe('2 minutes ago')
    expect(formatRelativeTime('2026-10-19T09:00:00Z', now)).toBe('3 hours ago')
    expect(formatRelativeTime('2026-10-18T12:00:00Z', now)).toBe('yesterday')
    expect(formatRelativeTime('2026-10-19T11:59:50Z', now)).toBe('just now')
  })

  it('pluralizes with thousands separators', () => {
    expect(pluralize(1, 'node')).toBe('1 node')
    expect(pluralize(0, 'edge')).toBe('0 edges')
    expect(pluralize(48210, 'node')).toBe('48,210 nodes')
  })

  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(10 * 1024 * 1024)).toBe('10.0 MB')
  })
})
