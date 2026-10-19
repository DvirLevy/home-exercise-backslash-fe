import { z } from 'zod'

const jsonObject = z.record(z.string(), z.unknown())

export const healthReportSchema = z.object({
  status: z.enum(['ok', 'unavailable']),
  database: z.enum(['up', 'down']),
  uptime: z.number(),
  timestamp: z.string(),
})

export const graphSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number(),
  nodeCount: z.number(),
  edgeCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const graphWriteResultSchema = graphSummarySchema.extend({
  placeholders: z.array(z.string()),
})

export const graphNodeSchema = z.object({
  name: z.string(),
  kind: z.string().nullable(),
  language: z.string().nullable(),
  path: z.string().nullable(),
  publicExposed: z.boolean().nullable(),
  placeholder: z.boolean(),
  vulnerabilities: z.array(jsonObject),
  metadata: jsonObject.nullable(),
  extra: jsonObject.nullable(),
})

export const graphEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  extra: jsonObject.optional(),
})

export const graphDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number(),
  extra: jsonObject.nullable(),
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
})

export const roleSchema = z.enum(['start', 'through', 'end'])

export const filterSchema = z.object({
  key: z.string(),
  description: z.string().nullable(),
  builtin: z.boolean(),
  // Filters are read-only in this app, so the rule is displayed but never edited.
  definition: jsonObject,
  matchCount: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const routeResultSchema = z.object({
  graphId: z.string(),
  version: z.number(),
  applied: z.object({
    start: z.array(z.string()),
    end: z.array(z.string()),
    through: z.array(z.string()),
  }),
  nodes: z.array(
    graphNodeSchema.extend({
      matched: z.object({ roles: z.array(roleSchema), filters: z.array(z.string()) }),
    }),
  ),
  edges: z.array(graphEdgeSchema),
})

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
})
