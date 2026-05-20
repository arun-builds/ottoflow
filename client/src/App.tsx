import { useCallback } from 'react';
import '@xyflow/react/dist/style.css';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';

// Import the custom nodes
import WebhookNode from './components/nodes/WebhookNode';
import LogNode from './components/nodes/LogNode';
import IfNode from './components/nodes/IfNode'; // <-- Import the If node

// Map the string types to the React components
const nodeTypes = {
  webhook: WebhookNode,
  log: LogNode,
  if: IfNode, // <-- Register it here
};

// Update initial state to show off the branching
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'webhook',
    position: { x: 50, y: 150 },
    data: { label: 'Stripe Payment Received' }
  },
  {
    id: '2',
    type: 'if',
    position: { x: 450, y: 100 },
    data: {
      label: 'Check payment amount',
      value1: '{{ $json.amount }}',
      operator: '>',
      value2: '1000'
    }
  },
  {
    id: '3',
    type: 'log',
    position: { x: 850, y: 50 },
    data: { label: 'Log High Value Customer' }
  },
  {
    id: '4',
    type: 'log',
    position: { x: 850, y: 250 },
    data: { label: 'Log Standard Customer' }
  },
];

const initialEdges: Edge[] = [

  { id: 'e1-2', source: '1', target: '2', sourceHandle: 'main', targetHandle: 'main' },

  { id: 'e2-3', source: '2', target: '3', sourceHandle: 'true', targetHandle: 'main', animated: true },

  { id: 'e2-4', source: '2', target: '4', sourceHandle: 'false', targetHandle: 'main' }
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-screen bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}