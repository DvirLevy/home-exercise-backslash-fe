import type { z } from 'zod'
import type {
  filterSchema,
  graphDetailSchema,
  graphEdgeSchema,
  graphNodeSchema,
  graphSummarySchema,
  graphWriteResultSchema,
  healthReportSchema,
  roleSchema,
  routeResultSchema,
} from '@/services/schemas'

export type HealthReport = z.infer<typeof healthReportSchema>
export type GraphSummary = z.infer<typeof graphSummarySchema>
export type GraphWriteResult = z.infer<typeof graphWriteResultSchema>
export type GraphNode = z.infer<typeof graphNodeSchema>
export type GraphEdge = z.infer<typeof graphEdgeSchema>
export type GraphDetail = z.infer<typeof graphDetailSchema>
export type Filter = z.infer<typeof filterSchema>
export type Role = z.infer<typeof roleSchema>
export type RouteResult = z.infer<typeof routeResultSchema>

export type ApiErrorDetail = { path: string; message: string }

/** The part of a graph the rename / replace / delete dialogs need. */
export type GraphRef = Pick<GraphSummary, 'id' | 'name' | 'version'>
