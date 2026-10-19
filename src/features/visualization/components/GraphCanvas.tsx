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
import { useEffect, useMemo, useRef } from 'react'
import { EmptyState } from '@/components/EmptyState'
import type { ReactNode } from 'react'
import type { GraphDetail, RouteResult } from '@/types/api'
import type { ViewMode } from '@/types/ui'
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
  /** The applied route query's result, or null when there is none. */
  route?: RouteResult | null
  mode?: ViewMode
  selected: string | null
  onSelect: (name: string | null) => void
  /** Controls shown at the top left (view switch, result summary). */
  toolbar?: ReactNode
  /** Drawn centred over the canvas, e.g. the "no route matches" state. */
  overlay?: ReactNode
}

export function GraphCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}

function Canvas({
  graph,
  route = null,
  mode = 'highlight',
  selected,
  onSelect,
  toolbar,
  overlay,
}: Props) {
  const { fitView } = useReactFlow()
  const model = useMemo(() => graphToFlow(graph, { route, mode }), [graph, route, mode])
  const nodes = useMemo<FlowNode[]>(
    () => model.nodes.map((n) => ({ ...n, selected: n.id === selected })),
    [model.nodes, selected],
  )
  const names = useMemo(() => graph.nodes.map((n) => n.name), [graph.nodes])

  // <ReactFlow fitView> only fits on mount, so the view is moved here whenever what the user should
  // be looking at changes:
  // - a route is applied: focus on the nodes of the route (the rest of the graph stays around them);
  // - the route is cleared, the drawn nodes change (Route only, another file): fit the whole drawing.
  // The "fit view" button of the controls always fits everything drawn.
  const drawnKey = useMemo(() => model.nodes.map((n) => n.id).join('\u0000'), [model.nodes])
  const focusIds = useMemo(
    () => (route && route.nodes.length > 0 ? route.nodes.map((n) => n.name) : null),
    [route],
  )
  const viewKey = `${drawnKey}\u0001${focusIds?.join('\u0000') ?? ''}`
  const fittedKey = useRef(`${drawnKey}\u0001`) // the key of the initial fit done by <ReactFlow fitView>
  useEffect(() => {
    if (fittedKey.current === viewKey) return
    fittedKey.current = viewKey
    void fitView({
      nodes: focusIds?.map((id) => ({ id })),
      duration: 300,
      padding: 0.2,
      maxZoom: 1.2,
    })
  }, [viewKey, focusIds, fitView])

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
      aria-label="Graph diagram"
    >
      <Background gap={18} size={1} />
      <Controls position="bottom-center" orientation="horizontal" showInteractive={false} />
      {graph.nodes.length >= MINIMAP_MIN_NODES ? (
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          className="@max-[640px]:hidden"
          nodeColor={(n) => kindColor((n as FlowNode).data.node.kind)}
        />
      ) : null}
      {/* One row at the top: toolbar on the left, search on the right; it wraps on a narrow canvas. */}
      <Panel
        position="top-left"
        className="pointer-events-none! flex w-[calc(100%-30px)] flex-wrap items-start justify-between gap-2"
      >
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          {toolbar}
          {graph.edges.length === 0 ? (
            <span className="bg-card rounded-full border px-3 py-1 text-[13px]">
              This graph has no edges
            </span>
          ) : null}
        </div>
        <div className="pointer-events-auto">
          <FindNode names={names} onPick={pick} />
        </div>
      </Panel>
      <Panel position="bottom-left" className="@max-[640px]:hidden">
        <Legend showRoles={route !== null} />
      </Panel>
      {overlay ? (
        <Panel position="top-center" className="top-1/3!">
          {overlay}
        </Panel>
      ) : null}
    </ReactFlow>
  )
}
