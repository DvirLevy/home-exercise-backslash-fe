import { ApiError, normalizeError } from '@/services/errors'
import type { ApiErrorDetail } from '@/types/api'

export type UploadErrorView = { title: string; message?: string; details: ApiErrorDetail[] }

/** Wording for upload / replace failures; the server's own details are always passed through. */
export function describeUploadError(error: unknown): UploadErrorView {
  const e: ApiError = normalizeError(error)
  switch (e.status) {
    case 413:
      return {
        title: 'The file is too large',
        message: `${e.message} The default limits are 10 MB, 50,000 nodes and 500,000 edges.`,
        details: e.details,
      }
    case 415:
      return { title: 'Please choose a JSON file', message: e.message, details: e.details }
    case 400:
      return { title: 'The file is not valid', message: e.message, details: e.details }
    default:
      return { title: 'Upload failed', message: e.message, details: e.details }
  }
}
