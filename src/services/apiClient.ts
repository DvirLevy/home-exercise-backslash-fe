import axios from 'axios'
import { env } from '@/env'
import { normalizeError } from './errors'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  // The backend wants repeated params (`start=a&start=b`), not `start[]=a`.
  paramsSerializer: { indexes: null },
})

apiClient.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(normalizeError(error)),
)
