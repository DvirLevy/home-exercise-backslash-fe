import { act, renderHook } from '@testing-library/react'
import { useDelayedFlag } from '@/hooks/useDelayedFlag'

describe('useDelayedFlag', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('turns on only after the delay', () => {
    const { result } = renderHook(() => useDelayedFlag(true, 300))
    expect(result.current).toBe(false)
    act(() => void vi.advanceTimersByTime(299))
    expect(result.current).toBe(false)
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current).toBe(true)
  })

  it('never shows for work that finishes quickly', () => {
    const { result, rerender } = renderHook(({ active }) => useDelayedFlag(active, 300), {
      initialProps: { active: true },
    })
    act(() => void vi.advanceTimersByTime(100))
    rerender({ active: false })
    act(() => void vi.advanceTimersByTime(1000))
    expect(result.current).toBe(false)
  })

  it('turns off as soon as the work ends', () => {
    const { result, rerender } = renderHook(({ active }) => useDelayedFlag(active, 300), {
      initialProps: { active: true },
    })
    act(() => void vi.advanceTimersByTime(400))
    expect(result.current).toBe(true)
    rerender({ active: false })
    expect(result.current).toBe(false)
  })
})
