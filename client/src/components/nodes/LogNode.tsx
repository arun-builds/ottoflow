import { Handle, Position } from '@xyflow/react';
import { FileText } from 'lucide-react';

export default function LogNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="w-44 rounded-lg border border-cyan-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-cyan-500/60">
      <Handle
        type="target"
        position={Position.Left}
        id="main"
        className="!w-2.5 !h-2.5 !bg-cyan-500 !border-2 !border-card hover:!scale-125 transition-transform"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/20">
          <FileText size={11} className="text-cyan-400" />
        </div>
        <span className="text-[11px] font-semibold text-foreground truncate">
          {(data.label as string) || 'Log'}
        </span>
      </div>

      <div className="px-3 py-1.5">
        <p className="text-[9px] text-muted-foreground truncate font-mono">
          {(data.message as string) || 'Logs current state'}
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="main"
        className="!w-2.5 !h-2.5 !bg-cyan-500 !border-2 !border-card hover:!scale-125 transition-transform"
      />
    </div>
  );
}
