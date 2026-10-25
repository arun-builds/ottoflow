import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Save, Loader2, ArrowLeft, Play, Copy, Check, MousePointer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import WebhookNode from '@/components/nodes/WebhookNode';
import EmailNode from '@/components/nodes/EmailNode';
import IfNode from '@/components/nodes/IfNode';
import HttpNode from '@/components/nodes/HttpNode';
import LogNode from '@/components/nodes/LogNode';
import Sidebar from '@/components/Sidebar';
import SettingsPanel from '@/components/SettingsPanel';

import { getWorkflow, createWorkflow, updateWorkflow } from '@/lib/api';

const nodeTypes = {
  webhook: WebhookNode,
  email: EmailNode,
  if: IfNode,
  http: HttpNode,
  log: LogNode,
};

let id = 2;
const getId = () => `${id++}`;

// ── Default data for each node type ────────────────────────────────────

function defaultDataForType(type: string): Record<string, unknown> {
  switch (type) {
    case 'webhook':
      return { label: 'Webhook Trigger' };
    case 'email':
      return {
        label: 'Send Email',
        to: 'recipient@example.com',
        subject: 'Notification',
        body: 'Hello {{webhook.data}}',
      };
    case 'if':
      return { label: 'Condition', value1: '{{webhook.amount}}', operator: '>=', value2: '100' };
    case 'http':
      return {
        label: 'HTTP Request',
        url: 'https://api.example.com',
        method: 'GET',
        body: '',
      };
    case 'log':
      return { label: 'Log', message: '{{ $json }}' };
    default:
      return { label: type };
  }
}

// ── Editor ─────────────────────────────────────────────────────────────

function FlowEditor() {
  const { id: workflowId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState('Draft Workflow');
  const [loading, setLoading] = useState(!!workflowId);
  const [copied, setCopied] = useState(false);

  // ── Load workflow ───────────────────────────────────────────────────

  useEffect(() => {
    if (!workflowId) return;

    getWorkflow(workflowId)
      .then((data) => {
        setWorkflowName(data.name || 'Untitled Workflow');
        if (data.nodes && Array.isArray(data.nodes)) {
          const flowNodes: Node[] = data.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position || { x: 0, y: 0 },
            data: n.data || { label: 'Node' },
          }));
          setNodes(flowNodes);
          id = Math.max(...flowNodes.map((n: Node) => parseInt(n.id) || 0), 1) + 1;
        }
        if (data.edges && Array.isArray(data.edges)) {
          const flowEdges: Edge[] = data.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle || 'main',
            targetHandle: e.targetHandle || 'main',
          }));
          setEdges(flowEdges);
        }
        // Fit view nicely with safe padding and maxZoom
        setTimeout(() => {
          fitView({ padding: 0.25, maxZoom: 0.85 });
        }, 100);
      })
      .catch(() => toast.error('Failed to load workflow'))
      .finally(() => setLoading(false));
  }, [workflowId, setNodes, setEdges, fitView]);

  // ── Save ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);

    const payload = {
      name: workflowName,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type!,
        data: n.data as Record<string, unknown>,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || 'main',
        targetHandle: e.targetHandle || 'main',
      })),
    };

    try {
      if (workflowId) {
        await updateWorkflow(workflowId, payload);
        toast.success('Workflow saved');
      } else {
        const saved = await createWorkflow(payload);
        navigate(`/workflows/${saved.id}`, { replace: true });
        toast.success('Workflow created');
      }
    } catch {
      toast.error('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Copy webhook URL ────────────────────────────────────────────────

  const copyWebhookUrl = () => {
    if (!workflowId) return;
    navigator.clipboard.writeText(`http://localhost:8081/hooks/${workflowId}`);
    setCopied(true);
    toast.success('Webhook URL copied');
    setTimeout(() => setCopied(false), 2000);
  };

  // ── React Flow handlers ─────────────────────────────────────────────

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
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: defaultDataForType(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  // ── Loading state ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow h-full relative">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-border/40 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 z-10 select-none">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/workflows')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
          <div className="h-4 w-px bg-border/40" />
          <input
            className="font-semibold text-xs text-foreground bg-transparent border border-transparent hover:border-border/40 focus:border-primary/50 focus:outline-none rounded px-2 py-1 min-w-0 max-w-[260px] transition-colors"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow name…"
          />
          <span className="text-[10px] text-muted-foreground/60 rounded bg-muted/60 px-1.5 py-0.5">
            {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {workflowId && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={copyWebhookUrl}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Webhook URL
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">
                    POST http://localhost:8081/hooks/{workflowId}
                  </p>
                </TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() =>
                  navigate(`/workflows/${workflowId}/executions`)
                }
              >
                <Play className="w-3.5 h-3.5" />
                Runs
              </Button>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="h-8 gap-1.5 text-xs shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {workflowId ? 'Save' : 'Create'}
          </Button>
        </div>
      </header>

      {/* ── Canvas ───────────────────────────────────────────────────── */}
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
          defaultViewport={{ x: 80, y: 80, zoom: 0.8 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2, stroke: 'oklch(0.55 0.25 265)' },
          }}
        >
          <Controls className="!rounded-lg !border-border/40 !shadow-md !bg-card/90" />
          <MiniMap
            className="!rounded-lg !border-border/40 !shadow-md"
            maskColor="oklch(0.13 0.005 265 / 70%)"
            nodeColor="oklch(0.65 0.28 265)"
            zoomable
            pannable
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="oklch(0.5 0 0 / 12%)"
          />
        </ReactFlow>

        {/* ── Empty state guide ────────────────────────────────────── */}
        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md px-6 py-5 text-center shadow-lg max-w-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                Your canvas is ready
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Drag trigger or action nodes from the palette on the left to start building your automation.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <MousePointer className="h-3 w-3" /> Click to edit
                </span>
                <span>•</span>
                <span>[Del] to remove</span>
                <span>•</span>
                <span>[Scroll] to zoom</span>
              </div>
            </div>
          </div>
        )}

        <SettingsPanel
          selectedNodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>
    </div>
  );
}

// ── Wrapper ────────────────────────────────────────────────────────────

export default function WorkflowEditor() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex w-full h-screen bg-background overflow-hidden">
        <Sidebar />
        <ReactFlowProvider>
          <FlowEditor />
        </ReactFlowProvider>
      </div>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
}
