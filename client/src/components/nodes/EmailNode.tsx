import { Handle, Position } from '@xyflow/react';
import { Mail } from 'lucide-react';

export default function EmailNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="w-48 rounded-lg border border-emerald-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-emerald-500/60">
      <Handle
        type="target"
        position={Position.Left}
        id="main"
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-card hover:!scale-125 transition-transform"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20">
          <Mail size={11} className="text-emerald-400" />
        </div>
        <span className="text-[11px] font-semibold text-foreground truncate">
          {(data.label as string) || 'Send Email'}
        </span>
      </div>

      <div className="px-3 py-1.5 space-y-0.5">
        <p className="text-[9px] text-muted-foreground truncate">
          <span className="text-emerald-400/80 font-medium">To:</span> {(data.to as string) || 'recipient@example.com'}
        </p>
        <p className="text-[9px] text-muted-foreground truncate">
          <span className="text-muted-foreground/60">Subj:</span> {(data.subject as string) || 'Notification'}
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="main"
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-card hover:!scale-125 transition-transform"
      />
    </div>
  );
}
