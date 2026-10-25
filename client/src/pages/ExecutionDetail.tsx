import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Webhook,
  Mail,
  GitBranch,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getNodeExecutions, type NodeExecution } from '@/lib/api';

// ── helpers ─────────────────────────────────────────────────────────────

const nodeIcons: Record<string, typeof Webhook> = {
  webhook: Webhook,
  email: Mail,
  if: GitBranch,
  http: Globe,
  log: FileText,
};

const nodeColors: Record<string, string> = {
  webhook: 'text-blue-400 bg-blue-500/10',
  email: 'text-emerald-400 bg-emerald-500/10',
  if: 'text-purple-400 bg-purple-500/10',
  http: 'text-amber-400 bg-amber-500/10',
  log: 'text-cyan-400 bg-cyan-500/10',
};

function statusIcon(status: string) {
  switch (status) {
    case 'success':
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
    success: { variant: 'default', className: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
    completed: { variant: 'default', className: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
    failed: { variant: 'destructive', className: 'border-red-500/30 text-red-400 bg-red-500/10' },
  };
  const s = map[status] ?? { variant: 'secondary' as const, className: '' };
  return (
    <Badge variant={s.variant} className={`text-[10px] uppercase tracking-wider font-semibold ${s.className}`}>
      {status}
    </Badge>
  );
}

// ── Collapsible JSON viewer ─────────────────────────────────────────────

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  const [expanded, setExpanded] = useState(false);
  if (!data) return null;

  const json = JSON.stringify(data, null, 2);
  const isLong = json.length > 200;

  return (
    <div>
      <button
        className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 hover:text-foreground transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {isLong && (expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
        {label}
      </button>
      <pre
        className={`rounded-lg bg-muted/50 border border-border/40 p-3 text-[11px] font-mono overflow-auto transition-all ${
          !expanded && isLong ? 'max-h-24' : 'max-h-96'
        }`}
      >
        {json}
      </pre>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────

export default function ExecutionDetail() {
  const { executionId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<NodeExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!executionId) return;

    getNodeExecutions(executionId)
      .then(setNodes)
      .catch(() => toast.error('Failed to load execution details'))
      .finally(() => setLoading(false));
  }, [executionId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Skeleton className="mb-10 h-10 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
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
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <div className="h-5 w-px bg-border/40" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Execution Detail</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {executionId}
          </p>
        </div>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {nodes.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Clock className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No node logs</h3>
            <p className="max-w-sm text-muted-foreground">
              Node execution data will appear here after the workflow runs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {nodes.map((node, index) => {
            const Icon = nodeIcons[node.node_type] || FileText;
            const colorClass = nodeColors[node.node_type] || 'text-muted-foreground bg-muted';

            return (
              <Card
                key={node.id}
                className="glass rounded-xl animate-slide-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <CardContent className="p-5">
                  {/* ── Node header ───────────────────────────────────── */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono font-medium">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[10px] font-bold">
                          {index + 1}
                        </span>
                      </div>
                      {statusIcon(node.status)}
                      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${colorClass.split(' ')[1]}`}>
                        <Icon className={`h-3.5 w-3.5 ${colorClass.split(' ')[0]}`} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold">
                          Node {node.node_id}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">
                          {node.node_type}
                        </span>
                      </div>
                    </div>
                    {statusBadge(node.status)}
                  </div>

                  {/* ── Data blocks ──────────────────────────────────── */}
                  <div className="space-y-3">
                    <JsonBlock label="Input" data={node.input_data} />
                    <JsonBlock label="Output" data={node.output_data} />

                    {node.error_message && (
                      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                        {node.error_message}
                      </div>
                    )}
                  </div>

                  <Separator className="my-3" />

                  <div className="text-[10px] text-muted-foreground">
                    {node.executed_at &&
                      new Date(node.executed_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
