import { z } from 'zod'
import type { GraphDetail, GraphSummary, GraphWriteResult } from '@/types/api'
import { apiClient } from './apiClient'
import { graphDetailSchema, graphSummarySchema, graphWriteResultSchema } from './schemas'

export type UploadProgress = (percent: number) => void

function fileForm(file: File, name?: string) {
  const form = new FormData()
  form.append('file', file)
  if (name !== undefined) form.append('name', name)
  return form
}

/** Content-Type is left to the browser so it adds the multipart boundary. */
function progressHandler(onProgress?: UploadProgress) {
  return onProgress
    ? (e: { loaded: number; total?: number }) => {
        if (e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    : undefined
}

export async function listGraphs(): Promise<GraphSummary[]> {
  const { data } = await apiClient.get('/api/v1/graphs')
  return z.array(graphSummarySchema).parse(data)
}

export async function getGraph(id: string): Promise<GraphDetail> {
  const { data } = await apiClient.get(`/api/v1/graphs/${encodeURIComponent(id)}`)
  return graphDetailSchema.parse(data)
}

export async function uploadGraph(
  input: { file: File; name: string },
  onProgress?: UploadProgress,
): Promise<GraphWriteResult> {
  const { data } = await apiClient.post('/api/v1/graphs', fileForm(input.file, input.name), {
    onUploadProgress: progressHandler(onProgress),
  })
  return graphWriteResultSchema.parse(data)
}

/** `version` is sent as If-Match; omit it to overwrite whatever is stored. */
export async function replaceGraph(
  id: string,
  input: { file: File; name?: string; version?: number },
  onProgress?: UploadProgress,
): Promise<GraphWriteResult> {
  const { data } = await apiClient.put(
    `/api/v1/graphs/${encodeURIComponent(id)}`,
    fileForm(input.file, input.name),
    {
      headers: input.version === undefined ? undefined : { 'If-Match': `"${input.version}"` },
      onUploadProgress: progressHandler(onProgress),
    },
  )
  return graphWriteResultSchema.parse(data)
}

export async function renameGraph(id: string, name: string): Promise<GraphSummary> {
  const { data } = await apiClient.patch(`/api/v1/graphs/${encodeURIComponent(id)}`, { name })
  return graphSummarySchema.parse(data)
}

export async function deleteGraph(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/graphs/${encodeURIComponent(id)}`)
}
