import { toast } from 'sonner'
import type { GraphWriteResult } from '@/types/api'
import { pluralize } from '@/utils/format'

/** Success toast; lists the placeholder nodes the file referenced but never defined. */
export function notifyUploaded(result: GraphWriteResult, verb: 'uploaded' | 'replaced') {
  const counts = `${pluralize(result.nodeCount, 'node')} · ${pluralize(result.edgeCount, 'edge')}`
  const placeholders =
    result.placeholders.length > 0
      ? ` · ${pluralize(result.placeholders.length, 'placeholder')} created: ${result.placeholders.join(', ')}`
      : ''
  toast.success(`Graph "${result.name}" ${verb}`, { description: `${counts}${placeholders}` })
}
