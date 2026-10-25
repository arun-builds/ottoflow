import { Link } from 'react-router-dom';
import {
  Webhook,
  GitBranch,
  Mail,
  Globe,
  FileText,
  Zap,
  GripVertical,
  ArrowLeft,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NodeEntry {
  type: string;
  label: string;
  description: string;
  icon: typeof Webhook;
  color: string;
  borderColor: string;
  bgColor: string;
}

const palette: NodeEntry[] = [
  {
    type: 'webhook',
    label: 'Webhook',
    description: 'HTTP trigger',
    icon: Webhook,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
  },
  {
    type: 'email',
    label: 'Send Email',
    description: 'SMTP action',
    icon: Mail,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
  },
  {
    type: 'if',
    label: 'If / Else',
    description: 'Conditional branch',
    icon: GitBranch,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
  },
  {
    type: 'http',
    label: 'HTTP Request',
    description: 'Call any API',
    icon: Globe,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
  },
  {
    type: 'log',
    label: 'Log',
    description: 'Debug output',
    icon: FileText,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20',
  },
];

export default function EditorSidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border/40 bg-card/80 backdrop-blur-sm select-none">
      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <div className="flex h-12 items-center gap-2 border-b border-border/40 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-3 w-3" />
          </div>
          <span className="text-xs font-bold tracking-tight">
            Otto<span className="text-primary">flow</span>
          </span>
        </Link>
      </div>

      {/* ── Palette ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Palette
        </div>
        <p className="mb-3 text-[10px] text-muted-foreground/70">
          Drag nodes onto canvas
        </p>

        <div className="space-y-1.5">
          {palette.map((node) => (
            <Tooltip key={node.type}>
              <TooltipTrigger asChild>
                <div
                  className={`group flex cursor-grab items-center gap-2 rounded-lg border ${node.borderColor} ${node.bgColor} px-2.5 py-2 transition-all active:cursor-grabbing active:scale-95`}
                  onDragStart={(e) => onDragStart(e, node.type)}
                  draggable
                >
                  <GripVertical className="h-2.5 w-2.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                  <node.icon className={`h-3.5 w-3.5 shrink-0 ${node.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold leading-tight text-foreground truncate">
                      {node.label}
                    </div>
                    <div className="text-[9px] text-muted-foreground/70 leading-tight truncate">
                      {node.description}
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Drag to add {node.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <Separator />
      <div className="p-3">
        <Link
          to="/workflows"
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Workflows
        </Link>
      </div>
    </aside>
  );
}
