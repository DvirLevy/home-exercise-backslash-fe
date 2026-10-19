import { AxiosError, AxiosHeaders } from 'axios'
import { ApiError, normalizeError } from '@/services/errors'

function axiosError(status: number | null, data?: unknown, headers: Record<string, string> = {}) {
  const config = { headers: new AxiosHeaders() }
  const response = status === null ? undefined : { status, data, headers, statusText: '', config }
  return new AxiosError('boom', 'ERR', config, {}, response)
}

describe('normalizeError', () => {
  it('maps an API error body to an ApiError with details and request id', () => {
    const e = normalizeError(
      axiosError(
        400,
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Bad file',
            details: [{ path: 'nodes.3.publicExposed', message: 'expected boolean' }],
          },
        },
        { 'x-request-id': 'req-1' },
      ),
    )
    expect(e).toBeInstanceOf(ApiError)
    expect(e).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Bad file',
      requestId: 'req-1',
    })
    expect(e.details).toEqual([{ path: 'nodes.3.publicExposed', message: 'expected boolean' }])
  })

  it('reports an unreachable API as a network error', () => {
    const e = normalizeError(axiosError(null))
    expect(e.isNetworkError).toBe(true)
    expect(e.status).toBeNull()
  })

  it('handles a response that is not in the ApiError shape', () => {
    const e = normalizeError(axiosError(502, '<html>Bad gateway</html>'))
    expect(e).toMatchObject({ status: 502, code: 'UNEXPECTED_RESPONSE' })
  })

  it('wraps unknown errors and returns ApiErrors untouched', () => {
    expect(normalizeError(new Error('oops')).message).toBe('oops')
    expect(normalizeError('weird').code).toBe('UNKNOWN_ERROR')
    const existing = new ApiError({ status: 404, code: 'GRAPH_NOT_FOUND', message: 'm' })
    expect(normalizeError(existing)).toBe(existing)
  })
})
