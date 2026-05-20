import { Handle, Position } from '@xyflow/react';
import { Mail } from 'lucide-react';

export default function EmailNode({ data }: { data: any }) {
    return (
        <div className="w-56 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <Handle
                type="target"
                position={Position.Left}
                id="main"
                className="!w-4 !h-4 !bg-emerald-500 !border-2 !border-white dark:!border-gray-900 hover:!scale-150 transition-transform"
            />

            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800">
                <Mail size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{data.label || 'Send Email'}</span>
            </div>

            <div className="px-3 py-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    To: {data.to || 'recipient@example.com'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Subj: {data.subject || 'Notification'}
                </p>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                id="main"
                className="!w-4 !h-4 !bg-emerald-500 !border-2 !border-white dark:!border-gray-900 hover:!scale-150 transition-transform"
            />
        </div>
    );
}
