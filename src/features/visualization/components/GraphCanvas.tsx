import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Boxes } from 'lucide-react'
import { useMemo } from 'react'
import { EmptyState } from '@/components/EmptyState'
import type { GraphDetail } from '@/types/api'
import { graphToFlow, type FlowNode } from '../utils/graphToFlow'
import { kindColor } from '../utils/nodeStyling'
import { FindNode } from './FindNode'
import { GraphNodeCard } from './GraphNodeCard'
import { Legend } from './Legend'

const nodeTypes = { graph: GraphNodeCard }

/** The minimap only helps once the graph no longer fits on screen. */
export const MINIMAP_MIN_NODES = 30

type Props = {
  graph: Pick<GraphDetail, 'id' | 'version' | 'nodes' | 'edges'>
  selected: string | null
  onSelect: (name: string | null) => void
}

export function GraphCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}

function Canvas({ graph, selected, onSelect }: Props) {
  const { fitView } = useReactFlow()
  const model = useMemo(() => graphToFlow(graph), [graph])
  const nodes = useMemo<FlowNode[]>(
    () => model.nodes.map((n) => ({ ...n, selected: n.id === selected })),
    [model.nodes, selected],
  )
  const names = useMemo(() => graph.nodes.map((n) => n.name), [graph.nodes])

  if (graph.nodes.length === 0) {
    return (
      <EmptyState icon={<Boxes className="size-5" aria-hidden />} title="This graph has no nodes">
        Replace the file with one that defines at least one node.
      </EmptyState>
    )
  }

  const handleNodeClick: NodeMouseHandler<FlowNode> = (_, node) => onSelect(node.id)

  function pick(name: string) {
    onSelect(name)
    void fitView({ nodes: [{ id: name }], duration: 300, maxZoom: 1.2 })
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={model.edges}
      nodeTypes={nodeTypes}
      colorMode="system"
      fitView
      minZoom={0.05}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      onlyRenderVisibleElements
      onNodeClick={handleNodeClick}
      onPaneClick={() => onSelect(null)}
      proOptions={{ hideAttribution: true }}
      aria-label="Graph diagram"
    >
      <Background gap={18} size={1} />
      <Controls position="bottom-center" orientation="horizontal" showInteractive={false} />
      {graph.nodes.length >= MINIMAP_MIN_NODES ? (
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          nodeColor={(n) => kindColor((n as FlowNode).data.node.kind)}
        />
      ) : null}
      <Panel position="top-right">
        <FindNode names={names} onPick={pick} />
      </Panel>
      {graph.edges.length === 0 ? (
        <Panel position="top-left">
          <span className="bg-card rounded-full border px-3 py-1 text-[13px]">
            This graph has no edges
          </span>
        </Panel>
      ) : null}
      <Panel position="bottom-left">
        <Legend />
      </Panel>
    </ReactFlow>
  )
}
