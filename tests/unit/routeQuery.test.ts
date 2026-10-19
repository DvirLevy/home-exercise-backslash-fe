import {
  addFilter,
  isQueryEmpty,
  parseRouteQuery,
  removeFilter,
  writeRouteQuery,
} from '@/features/filters/utils/routeQuery'

const parse = (search: string) => parseRouteQuery(new URLSearchParams(search))

describe('parseRouteQuery', () => {
  it('reads every role, keeping repeated values in order', () => {
    expect(parse('?start=public&start=vulnerable&through=high-severity&end=sink')).toEqual({
      start: ['public', 'vulnerable'],
      through: ['high-severity'],
      end: ['sink'],
    })
  })

  it('returns an empty query for an empty or unrelated URL', () => {
    expect(parse('')).toEqual({ start: [], through: [], end: [] })
    expect(parse('?foo=bar&tab=x')).toEqual({ start: [], through: [], end: [] })
  })

  it('drops duplicates and empty values, and accepts comma-separated lists', () => {
    expect(parse('?start=a&start=a&start=&end=b,c, d')).toEqual({
      start: ['a'],
      through: [],
      end: ['b', 'c', 'd'],
    })
  })
})

describe('writeRouteQuery', () => {
  it('writes repeated params and replaces the old values', () => {
    const next = writeRouteQuery(new URLSearchParams('start=old&end=old'), {
      start: ['public', 'vulnerable'],
      through: [],
      end: ['sink'],
    })
    expect(next.toString()).toBe('start=public&start=vulnerable&end=sink')
  })

  it('leaves unrelated params untouched', () => {
    const next = writeRouteQuery(new URLSearchParams('foo=bar&start=x'), {
      start: [],
      through: ['t'],
      end: [],
    })
    expect(next.get('foo')).toBe('bar')
    expect(next.has('start')).toBe(false)
    expect(next.getAll('through')).toEqual(['t'])
  })

  it('round-trips through parse', () => {
    const q = { start: ['a', 'b'], through: ['c'], end: ['d'] }
    expect(parseRouteQuery(writeRouteQuery(new URLSearchParams(), q))).toEqual(q)
  })
})

describe('query helpers', () => {
  const empty = { start: [], through: [], end: [] }

  it('adds a filter once and removes it', () => {
    const one = addFilter(empty, 'start', 'public')
    expect(addFilter(one, 'start', 'public')).toBe(one)
    expect(addFilter(one, 'start', 'sink').start).toEqual(['public', 'sink'])
    expect(removeFilter(one, 'start', 'public')).toEqual(empty)
  })

  it('does not change other roles', () => {
    expect(addFilter(empty, 'end', 'sink')).toEqual({ start: [], through: [], end: ['sink'] })
  })

  it('tells whether any role is set', () => {
    expect(isQueryEmpty(empty)).toBe(true)
    expect(isQueryEmpty({ ...empty, through: ['x'] })).toBe(false)
  })
})
