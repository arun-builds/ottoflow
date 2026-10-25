import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Loader2,
  Clock,
  FileText,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Play,
  Workflow,
  Webhook,
  GitBranch,
  Mail,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  listWorkflows,
  createWorkflow,
  deleteWorkflow,
  type Workflow as WorkflowType,
} from '@/lib/api';

// ── status helpers ──────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
    draft: { variant: 'secondary', className: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
    active: { variant: 'default', className: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
    paused: { variant: 'secondary', className: 'border-muted-foreground/30 text-muted-foreground' },
  };
  const s = map[status] ?? map.draft;
  return (
    <Badge variant={s.variant} className={`text-[10px] uppercase tracking-wider font-semibold ${s.className}`}>
      {status}
    </Badge>
  );
}

// ── node-count visual preview ───────────────────────────────────────────

const nodeIcons: Record<string, typeof Webhook> = {
  webhook: Webhook,
  email: Mail,
  if: GitBranch,
  http: Globe,
  log: FileText,
};

function NodePreview({ nodes }: { nodes?: { type: string }[] }) {
  if (!nodes || nodes.length === 0) return null;

  const typeCounts: Record<string, number> = {};
  for (const n of nodes) {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.entries(typeCounts).map(([type, count]) => {
        const Icon = nodeIcons[type] || Workflow;
        return (
          <div
            key={type}
            className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            <Icon className="h-3 w-3" />
            {count}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────

export default function WorkflowsList() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WorkflowType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWorkflows = () => {
    setLoading(true);
    listWorkflows()
      .then(setWorkflows)
      .catch(() => toast.error('Failed to load workflows'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreate = async () => {
    try {
      const created = await createWorkflow({
        name: `Untitled Workflow`,
        nodes: [],
        edges: [],
      });
      navigate(`/workflows/${created.id}`);
    } catch {
      toast.error('Failed to create workflow');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteWorkflow(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      fetchWorkflows();
    } catch {
      toast.error('Failed to delete workflow');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = workflows.filter((wf) =>
    wf.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading skeleton ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="mt-1 text-muted-foreground">
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workflows…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button onClick={handleCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {filtered.length === 0 && !search ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No workflows yet</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">
              Create your first workflow to start automating tasks with visual
              pipelines.
            </p>
            <Button onClick={handleCreate} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 && search ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-semibold">No results</h3>
            <p className="text-muted-foreground">
              No workflows matching "{search}"
            </p>
          </CardContent>
        </Card>
      ) : (
        /* ── Grid ──────────────────────────────────────────────────────── */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((wf, idx) => (
            <Card
              key={wf.id}
              className="group relative glass rounded-xl transition-all hover:glow-sm hover:-translate-y-0.5 animate-slide-up cursor-pointer"
              style={{ animationDelay: `${idx * 0.04}s` }}
              onClick={() => navigate(`/workflows/${wf.id}`)}
            >
              <CardContent className="p-5">
                {/* Top row */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Workflow className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold leading-tight">
                        {wf.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                        {wf.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => navigate(`/workflows/${wf.id}`)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/workflows/${wf.id}/executions`)}>
                        <Play className="mr-2 h-3.5 w-3.5" />
                        View Runs
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(wf)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status + meta */}
                <div className="mb-3 flex items-center gap-2">
                  {statusBadge(wf.status)}
                  {wf.nodes && (
                    <span className="text-[11px] text-muted-foreground">
                      {wf.nodes.length} node{wf.nodes.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Node preview */}
                <div className="mb-3">
                  <NodePreview nodes={wf.nodes} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(wf.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-[11px] px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workflows/${wf.id}/executions`);
                    }}
                  >
                    <Play className="h-3 w-3" />
                    Runs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Delete dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
