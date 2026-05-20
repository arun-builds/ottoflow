import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function IfNode({ data }: { data: any }) {
    return (
        <div className="w-52 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <Handle
                type="target"
                position={Position.Left}
                id="main"
                className="!w-4 !h-4 !bg-gray-500 !border-2 !border-white dark:!border-gray-900 hover:!scale-150 transition-transform"
            />

            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/50 border-b border-purple-200 dark:border-purple-800">
                <GitBranch size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{data.label || 'Condition'}</span>
            </div>

            <div className="px-3 py-2 space-y-2">
                <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1.5 rounded text-xs font-mono text-center border border-gray-200 dark:border-gray-700">
                    <span className="text-blue-600 dark:text-blue-400">{data.value1 || 'val1'}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold mx-1">{data.operator || '=='}</span>
                    <span className="text-green-600 dark:text-green-400">{data.value2 || 'val2'}</span>
                </div>
            </div>

            <div className="relative h-10 border-t border-gray-200 dark:border-gray-700">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-green-600 dark:text-green-400">True</div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-red-600 dark:text-red-400">False</div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                id="true"
                style={{ top: '60%' }}
                className="!w-4 !h-4 !bg-green-500 !border-2 !border-white dark:!border-gray-900 hover:!scale-150 transition-transform"
            />

            <Handle
                type="source"
                position={Position.Right}
                id="false"
                style={{ top: '85%' }}
                className="!w-4 !h-4 !bg-red-500 !border-2 !border-white dark:!border-gray-900 hover:!scale-150 transition-transform"
            />
        </div>
    );
}
