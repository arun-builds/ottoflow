import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Workflow {
    id: string;
    name: string;
    workspace_id: string;
    status: string;
    created_at: string;
    updated_at: string;
}

const API_BASE = 'http://localhost:8080';

export default function WorkflowsList() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/workflows`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setWorkflows(data);
            })
            .catch((err) => console.error('Failed to fetch workflows:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        const payload = {
            name: `New Workflow ${new Date().toLocaleTimeString()}`,
            workspace_id: '00000000-0000-0000-0000-000000000001',
            nodes: [],
            edges: [],
        };

        const res = await fetch(`${API_BASE}/api/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            const created = await res.json();
            window.location.href = `/workflows/${created.id}`;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Workflows</h1>
                    <p className="text-muted-foreground mt-1">Manage and monitor your automation workflows</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Workflow
                </Button>
            </div>

            {workflows.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No workflows yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first workflow to get started</p>
                        <Button onClick={handleCreate}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Workflow
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {workflows.map((wf) => (
                        <Card key={wf.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-base truncate flex-1">{wf.name}</CardTitle>
                                    <Badge variant={wf.status === 'draft' ? 'secondary' : 'default'} className="ml-2 shrink-0">
                                        {wf.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground mb-4">
                                    Updated {new Date(wf.updated_at).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                    <Link to={`/workflows/${wf.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            Edit
                                        </Button>
                                    </Link>
                                    <Link to={`/workflows/${wf.id}/executions`} className="flex-1">
                                        <Button variant="ghost" size="sm" className="w-full">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Runs
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
