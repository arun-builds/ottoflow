import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { listExecutions, getWorkflow, type Execution } from '@/lib/api';

// ── status helpers ──────────────────────────────────────────────────────

function statusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    default:
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
}

function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
    completed: { variant: 'default', className: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
    failed: { variant: 'destructive', className: 'border-red-500/30 text-red-400 bg-red-500/10' },
    running: { variant: 'secondary', className: 'border-blue-500/30 text-blue-400 bg-blue-500/10' },
  };
  const s = map[status] ?? { variant: 'secondary' as const, className: '' };
  return (
    <Badge variant={s.variant} className={`text-[10px] uppercase tracking-wider font-semibold ${s.className}`}>
      {status}
    </Badge>
  );
}

function duration(started: string, finished: string | null): string {
  if (!finished) return 'running…';
  const ms = new Date(finished).getTime() - new Date(started).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Main page ───────────────────────────────────────────────────────────

export default function WorkflowExecutions() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [workflowName, setWorkflowName] = useState('Workflow');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workflowId) return;

    getWorkflow(workflowId)
      .then((data) => setWorkflowName(data.name || 'Workflow'))
      .catch(() => {});

    listExecutions(workflowId)
      .then(setExecutions)
      .catch(() => toast.error('Failed to load executions'))
      .finally(() => setLoading(false));
  }, [workflowId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Skeleton className="mb-10 h-10 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-10 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(`/workflows/${workflowId}`)}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Editor
        </Button>
        <div className="h-5 w-px bg-border/40" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workflowName}</h1>
          <p className="text-sm text-muted-foreground">
            {executions.length} execution{executions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {executions.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Clock className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No executions yet</h3>
            <p className="max-w-sm text-muted-foreground">
              Trigger this workflow via its webhook URL to see execution history.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {executions.map((exec, idx) => (
            <Card
              key={exec.id}
              className="group glass rounded-xl transition-all hover:glow-sm hover:-translate-y-0.5 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${idx * 0.04}s` }}
              onClick={() => navigate(`/executions/${exec.id}`)}
            >
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  {statusIcon(exec.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium">
                        {exec.id.slice(0, 12)}…
                      </span>
                      {statusBadge(exec.status)}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span>
                        {new Date(exec.started_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>
                        Duration: {duration(exec.started_at, exec.finished_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-xs"
                >
                  Details
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
