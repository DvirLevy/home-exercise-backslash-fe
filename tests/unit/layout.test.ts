import { computeLayout, NODE_WIDTH } from '@/features/visualization/utils/layout'

describe('computeLayout', () => {
  it('lays a chain out left to right', () => {
    const pos = computeLayout({
      nodes: ['a', 'b', 'c'],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    })
    expect(pos.get('a')!.x).toBeLessThan(pos.get('b')!.x)
    expect(pos.get('b')!.x).toBeLessThan(pos.get('c')!.x)
    expect(pos.get('b')!.x - pos.get('a')!.x).toBeGreaterThan(NODE_WIDTH)
  })

  it('stacks siblings vertically without overlap', () => {
    const pos = computeLayout({
      nodes: ['root', 'x', 'y'],
      edges: [
        { from: 'root', to: 'x' },
        { from: 'root', to: 'y' },
      ],
    })
    expect(pos.get('x')!.x).toBe(pos.get('y')!.x)
    expect(Math.abs(pos.get('x')!.y - pos.get('y')!.y)).toBeGreaterThan(80)
  })

  it('gives every node a position, including isolated ones', () => {
    const pos = computeLayout({ nodes: ['a', 'lonely'], edges: [] })
    expect([...pos.keys()]).toEqual(['a', 'lonely'])
  })

  it('survives cycles and self loops', () => {
    const pos = computeLayout({
      nodes: ['a', 'b'],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
        { from: 'a', to: 'a' },
      ],
    })
    expect(pos.size).toBe(2)
    for (const p of pos.values()) expect(Number.isFinite(p.x + p.y)).toBe(true)
  })

  it('ignores edges to unknown nodes', () => {
    const pos = computeLayout({ nodes: ['a'], edges: [{ from: 'a', to: 'ghost' }] })
    expect([...pos.keys()]).toEqual(['a'])
  })

  it('handles an empty graph', () => {
    expect(computeLayout({ nodes: [], edges: [] }).size).toBe(0)
  })
})
