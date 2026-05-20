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
import { Save, Loader2, ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

import WebhookNode from '@/components/nodes/WebhookNode';
import EmailNode from '@/components/nodes/EmailNode';
import IfNode from '@/components/nodes/IfNode';
import Sidebar from '@/components/Sidebar';
import SettingsPanel from '@/components/SettingsPanel';

const nodeTypes = {
    webhook: WebhookNode,
    email: EmailNode,
    if: IfNode,
};

const API_BASE = 'http://localhost:8080';

let id = 2;
const getId = () => `${id++}`;

function FlowEditor() {
    const { id: workflowId } = useParams();
    const navigate = useNavigate();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { screenToFlowPosition } = useReactFlow();

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [workflowName, setWorkflowName] = useState('Draft Workflow');
    const [loading, setLoading] = useState(!!workflowId);

    useEffect(() => {
        if (!workflowId) return;

        fetch(`${API_BASE}/api/workflows/${workflowId}`)
            .then((res) => {
                if (!res.ok) throw new Error('Workflow not found');
                return res.json();
            })
            .then((data) => {
                setWorkflowName(data.name || 'Untitled Workflow');
                if (data.nodes && Array.isArray(data.nodes)) {
                    const flowNodes: Node[] = data.nodes.map((n: any) => ({
                        id: n.id,
                        type: n.type,
                        position: n.position || { x: 0, y: 0 },
                        data: n.data || { label: 'Node' },
                    }));
                    setNodes(flowNodes);
                    id = Math.max(...flowNodes.map((n: Node) => parseInt(n.id)), 1) + 1;
                }
                if (data.edges && Array.isArray(data.edges)) {
                    const flowEdges: Edge[] = data.edges.map((e: any) => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        sourceHandle: e.source_handle || e.sourceHandle || 'main',
                        targetHandle: e.target_handle || e.targetHandle || 'main',
                    }));
                    setEdges(flowEdges);
                }
            })
            .catch((err) => console.error('Failed to load workflow:', err))
            .finally(() => setLoading(false));
    }, [workflowId]);

    const handleSave = async () => {
        setIsSaving(true);

        const payload = {
            name: workflowName,
            workspace_id: '00000000-0000-0000-0000-000000000001',
            nodes: nodes.map((n) => ({
                id: n.id,
                type: n.type,
                data: n.data,
                position: n.position,
            })),
            edges: edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                source_handle: e.sourceHandle || 'main',
                target_handle: e.targetHandle || 'main',
            })),
        };

        const url = workflowId
            ? `${API_BASE}/api/workflows/${workflowId}`
            : `${API_BASE}/api/workflows`;
        const method = workflowId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to save workflow');

            const saved = await response.json();
            if (!workflowId && saved.id) {
                navigate(`/workflows/${saved.id}`, { replace: true });
            }
        } catch (error) {
            console.error(error);
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

            let defaultData: any = {};
            if (type === 'webhook') defaultData = { label: 'Webhook Trigger' };
            if (type === 'email') defaultData = { label: 'Send Email', to: 'recipient@example.com', subject: 'Notification', body: 'Hello {{webhook.data}}' };
            if (type === 'if') defaultData = { label: 'Condition', value1: '', operator: '==', value2: '' };

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-grow h-full relative">
            <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                    <input
                        className="font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {workflowId && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/workflows/${workflowId}/executions`)}
                        >
                            <Play className="w-4 h-4 mr-2" />
                            View Runs
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={isSaving} size="sm">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {workflowId ? 'Update' : 'Save'}
                    </Button>
                </div>
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

                <SettingsPanel
                    selectedNodeId={selectedNodeId}
                    onClose={() => setSelectedNodeId(null)}
                />
            </div>
        </div>
    );
}

export default function WorkflowEditor() {
    return (
        <div className="flex w-full h-screen bg-muted/20">
            <Sidebar />
            <ReactFlowProvider>
                <FlowEditor />
            </ReactFlowProvider>
        </div>
    );
}
