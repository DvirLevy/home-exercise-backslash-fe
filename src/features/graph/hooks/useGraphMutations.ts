import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  deleteGraph,
  renameGraph,
  replaceGraph,
  uploadGraph,
  type UploadProgress,
} from '@/services/graphs'
import { queryKeys } from '@/services/queryKeys'

export function useUploadGraph() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { file: File; name: string; onProgress?: UploadProgress }) =>
      uploadGraph({ file: vars.file, name: vars.name }, vars.onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.graphs }),
  })
}

/** `version` undefined = overwrite without If-Match. */
export function useReplaceGraph(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      file: File
      name?: string
      version?: number
      onProgress?: UploadProgress
    }) => replaceGraph(id, vars, vars.onProgress),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.graph(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.filters(id) }),
        queryClient.invalidateQueries({ queryKey: ['routes', id] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.graphs }),
      ]),
  })
}

export function useRenameGraph(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => renameGraph(id, name),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.graph(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.graphs }),
      ]),
  })
}

export function useDeleteGraph(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteGraph(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.graph(id) })
      queryClient.removeQueries({ queryKey: queryKeys.filters(id) })
      queryClient.removeQueries({ queryKey: ['routes', id] })
      return queryClient.invalidateQueries({ queryKey: queryKeys.graphs })
    },
  })
}
