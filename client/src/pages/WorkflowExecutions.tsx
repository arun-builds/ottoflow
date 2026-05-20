import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Execution {
    id: string;
    workflow_id: string;
    status: string;
    started_at: string;
    completed_at: string;
    input_data: any;
    output_data: any;
    error_message: string;
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
            return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
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

export default function WorkflowExecutions() {
    const { workflowId } = useParams();
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [workflowName, setWorkflowName] = useState('Workflow');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workflowId) return;

        fetch(`${API_BASE}/api/workflows/${workflowId}`)
            .then((res) => res.json())
            .then((data) => setWorkflowName(data.name || 'Workflow'))
            .catch(() => {});

        fetch(`${API_BASE}/api/workflows/${workflowId}/executions`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setExecutions(data);
            })
            .catch((err) => console.error('Failed to fetch executions:', err))
            .finally(() => setLoading(false));
    }, [workflowId]);

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
                <Link to={`/workflows/${workflowId}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{workflowName}</h1>
                    <p className="text-muted-foreground mt-1">Execution History</p>
                </div>
            </div>

            {executions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No executions yet</h3>
                        <p className="text-muted-foreground">Run your workflow to see execution history here</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {executions.map((exec) => (
                        <Card key={exec.id} className="hover:shadow-sm transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {statusIcon(exec.status)}
                                        <CardTitle className="text-base font-mono text-sm">{exec.id.slice(0, 12)}...</CardTitle>
                                    </div>
                                    <Badge variant={statusVariant(exec.status)}>{exec.status}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <div className="flex gap-6">
                                        <span>Started: {new Date(exec.started_at).toLocaleString()}</span>
                                        {exec.completed_at && (
                                            <span>Completed: {new Date(exec.completed_at).toLocaleString()}</span>
                                        )}
                                    </div>
                                    <Link to={`/executions/${exec.id}`}>
                                        <Button variant="link" size="sm" className="p-0 h-auto">
                                            View Details
                                        </Button>
                                    </Link>
                                </div>
                                {exec.error_message && (
                                    <div className="mt-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                        {exec.error_message}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
