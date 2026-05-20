import { Handle, Position } from '@xyflow/react';
import { Webhook } from 'lucide-react';

export default function WebhookNode({ data }: { data: any }) {
  return (
    <div className="w-44 rounded-lg border-2 border-blue-500/30 bg-white dark:bg-gray-900 shadow-md overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-800">
        <Webhook size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{data.label || 'Webhook'}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="main"
        className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white dark:!border-gray-900 hover:!scale-150 transition-transform"
      />
    </div>
  );
}
