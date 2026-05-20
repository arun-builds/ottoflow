import { useCallback, useState } from 'react';
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
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import WebhookNode from './components/nodes/WebhookNode';
import LogNode from './components/nodes/LogNode';
import IfNode from './components/nodes/IfNode';
import Sidebar from './components/Sidebar';
import SettingsPanel from './components/SettingsPanel';
import WebhookTestPanel from './components/WebhookTestPanel';

const nodeTypes = {
  webhook: WebhookNode,
  log: LogNode,
  if: IfNode,
};

const initialNodes: Node[] = [
  { id: '1', type: 'webhook', position: { x: 250, y: 150 }, data: { label: 'New Webhook' } },
];
const initialEdges: Edge[] = [];

let id = 2;
const getId = () => `${id++}`;

function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  const handleSave = async () => {
    setIsSaving(true);


    const payload = {
      name: "My First Workflow",
      workspace_id: "workspace-2",
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        data: n.data,

        position: n.position
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        // Go backend expects snake_case for the handles based on standard struct tags
        source_handle: e.sourceHandle || 'main',
        target_handle: e.targetHandle || 'main'
      }))
    };

    try {
      // 2. Post to  Go API 
      const response = await fetch('http://localhost:8080/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save workflow');

      alert('Workflow saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Error saving workflow. Is the Go backend running?');
    } finally {
      setIsSaving(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      let defaultData: any = { label: 'New Node' };
      if (type === 'webhook') defaultData = { label: 'Incoming Webhook' };
      if (type === 'if') defaultData = { label: 'Condition', value1: '', operator: '==', value2: '' };
      if (type === 'log') defaultData = { label: 'Log Output' };

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: defaultData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="flex flex-col flex-grow h-full relative">

      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 z-10 shadow-sm">
        <div className="font-semibold text-foreground">Draft Workflow</div>
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Canvas
        </Button>
      </header>


      <div className="flex-grow relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        <WebhookTestPanel />

        <SettingsPanel
          selectedNodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex w-full h-screen bg-muted/20">
      <Sidebar />
      <ReactFlowProvider>
        <FlowBuilder />
      </ReactFlowProvider>
    </div>
  );
}