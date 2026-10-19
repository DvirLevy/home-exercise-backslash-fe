import type { HealthReport } from '@/types/api'
import { apiClient } from './apiClient'
import { healthReportSchema } from './schemas'

/** 503 carries the same body as 200 (database down), so both count as a report. */
export async function getHealth(): Promise<HealthReport> {
  const { data } = await apiClient.get('/health', { validateStatus: (s) => s === 200 || s === 503 })
  return healthReportSchema.parse(data)
}
