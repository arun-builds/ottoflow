import { Handle, Position } from '@xyflow/react';
import { Globe } from 'lucide-react';

export default function HttpNode({ data }: { data: Record<string, unknown> }) {
  const method = ((data.method as string) || 'GET').toUpperCase();
  const methodColor: Record<string, string> = {
    GET: 'text-blue-400',
    POST: 'text-emerald-400',
    PUT: 'text-amber-400',
    DELETE: 'text-red-400',
    PATCH: 'text-purple-400',
  };

  return (
    <div className="w-48 rounded-lg border border-amber-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-amber-500/60">
      <Handle
        type="target"
        position={Position.Left}
        id="main"
        className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-card hover:!scale-125 transition-transform"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20">
          <Globe size={11} className="text-amber-400" />
        </div>
        <span className="text-[11px] font-semibold text-foreground truncate">
          {(data.label as string) || 'HTTP Request'}
        </span>
      </div>

      <div className="px-3 py-1.5 space-y-0.5">
        <p className="text-[9px] font-mono truncate">
          <span className={`font-bold ${methodColor[method] || 'text-muted-foreground'}`}>
            {method}
          </span>{' '}
          <span className="text-muted-foreground">{(data.url as string) || 'https://...'}</span>
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="main"
        className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-card hover:!scale-125 transition-transform"
      />
    </div>
  );
}
