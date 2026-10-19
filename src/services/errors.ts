import axios from 'axios'
import type { ApiErrorDetail } from '@/types/api'
import { apiErrorBodySchema } from './schemas'

export class ApiError extends Error {
  readonly status: number | null
  readonly code: string
  readonly details: ApiErrorDetail[]
  readonly requestId: string | null

  constructor(init: {
    status: number | null
    code: string
    message: string
    details?: ApiErrorDetail[]
    requestId?: string | null
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.details = init.details ?? []
    this.requestId = init.requestId ?? null
  }

  get isNetworkError() {
    return this.code === 'NETWORK_ERROR'
  }
}

/** Turns anything thrown by the HTTP layer into an ApiError. */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError({
        status: null,
        code: 'NETWORK_ERROR',
        message: "Can't reach the API. Check that the backend is running.",
      })
    }
    const { status, data, headers } = error.response
    const requestId = (headers['x-request-id'] as string | undefined) ?? null
    const parsed = apiErrorBodySchema.safeParse(data)
    if (parsed.success) {
      return new ApiError({ status, requestId, ...parsed.data.error })
    }
    return new ApiError({
      status,
      requestId,
      code: 'UNEXPECTED_RESPONSE',
      message: `The API answered with an unexpected response (HTTP ${status}).`,
    })
  }

  return new ApiError({
    status: null,
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'Something went wrong.',
  })
}
