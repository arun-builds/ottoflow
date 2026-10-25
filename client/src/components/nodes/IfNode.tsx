import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function IfNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="w-48 rounded-lg border border-purple-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-purple-500/60">
      <Handle
        type="target"
        position={Position.Left}
        id="main"
        className="!w-2.5 !h-2.5 !bg-purple-400 !border-2 !border-card hover:!scale-125 transition-transform"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border-b border-purple-500/20">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/20">
          <GitBranch size={11} className="text-purple-400" />
        </div>
        <span className="text-[11px] font-semibold text-foreground truncate">
          {(data.label as string) || 'Condition'}
        </span>
      </div>

      <div className="px-3 py-1.5">
        <div className="rounded bg-muted/40 px-2 py-1 text-[9px] font-mono text-center border border-border/30 truncate">
          <span className="text-blue-400">{(data.value1 as string) || 'val1'}</span>
          <span className="mx-1 font-bold text-purple-400">{(data.operator as string) || '=='}</span>
          <span className="text-emerald-400">{(data.value2 as string) || 'val2'}</span>
        </div>
      </div>

      <div className="border-t border-border/30 px-3 py-1.5 space-y-1.5">
        <div className="relative flex items-center justify-end pr-2 text-[9px] font-semibold text-emerald-400">
          <span>True</span>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: 'auto', transform: 'translateY(-50%)' }}
            className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-card hover:!scale-125 transition-transform !right-[-5px]"
          />
        </div>
        <div className="relative flex items-center justify-end pr-2 text-[9px] font-semibold text-red-400">
          <span>False</span>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: 'auto', transform: 'translateY(-50%)' }}
            className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-card hover:!scale-125 transition-transform !right-[-5px]"
          />
        </div>
      </div>
    </div>
  );
}
