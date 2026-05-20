import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NodeExecution {
    id: string;
    execution_id: string;
    node_id: string;
    node_type: string;
    status: string;
    input_data: any;
    output_data: any;
    error_message: string;
    started_at: string;
    completed_at: string;
}

const API_BASE = 'http://localhost:8080';

const statusIcon = (status: string) => {
    switch (status) {
        case 'completed':
            return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        case 'failed':
            return <XCircle className="w-4 h-4 text-red-500" />;
        case 'running':
            return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
        default:
            return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
};

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
        case 'completed':
            return 'default';
        case 'failed':
            return 'destructive';
        case 'running':
            return 'secondary';
        default:
            return 'secondary';
    }
};

export default function ExecutionDetail() {
    const { executionId } = useParams();
    const [nodes, setNodes] = useState<NodeExecution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!executionId) return;

        fetch(`${API_BASE}/api/executions/${executionId}/nodes`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setNodes(data);
            })
            .catch((err) => console.error('Failed to fetch node executions:', err))
            .finally(() => setLoading(false));
    }, [executionId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/workflows">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Execution Details</h1>
                    <p className="text-muted-foreground mt-1 font-mono text-sm">{executionId}</p>
                </div>
            </div>

            {nodes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No node logs</h3>
                        <p className="text-muted-foreground">Node execution data will appear here after the workflow runs</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {nodes.map((node, index) => (
                        <Card key={node.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-mono text-muted-foreground w-6">#{index + 1}</span>
                                        {statusIcon(node.status)}
                                        <CardTitle className="text-base">
                                            {node.node_id}
                                            <span className="text-muted-foreground text-sm ml-2">({node.node_type})</span>
                                        </CardTitle>
                                    </div>
                                    <Badge variant={statusVariant(node.status)}>{node.status}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    {node.input_data && (
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">Input</div>
                                            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-32">
                                                {JSON.stringify(node.input_data, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {node.output_data && (
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">Output</div>
                                            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-32">
                                                {JSON.stringify(node.output_data, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {node.error_message && (
                                        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                                            {node.error_message}
                                        </div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                        {node.started_at && new Date(node.started_at).toLocaleString()}
                                        {node.completed_at && ` → ${new Date(node.completed_at).toLocaleString()}`}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
