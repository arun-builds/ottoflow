import { Handle, Position } from '@xyflow/react';
import { Webhook } from 'lucide-react';

export default function WebhookNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="w-44 rounded-lg border border-blue-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-blue-500/60">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border-b border-blue-500/20">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/20">
          <Webhook size={11} className="text-blue-400" />
        </div>
        <span className="text-[11px] font-semibold text-foreground truncate">
          {(data.label as string) || 'Webhook'}
        </span>
      </div>
      <div className="px-3 py-1.5 text-[9px] text-muted-foreground font-mono">
        HTTP POST trigger
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="main"
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-card hover:!scale-125 transition-transform"
      />
    </div>
  );
}
