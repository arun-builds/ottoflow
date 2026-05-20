import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch } from 'lucide-react';

export default function IfNode({ data }: { data: any }) {
    return (
        <Card className="w-60 border border-border shadow-sm bg-card relative">
            <Handle
                type="target"
                position={Position.Left}
                id="main"
                className="w-5 h-5 bg-muted-foreground border-2 border-background cursor-crosshair transition-transform hover:scale-125"
            />

            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-md text-purple-600 dark:text-purple-400">
                        <GitBranch size={14} />
                    </div>
                    <CardTitle className="text-sm font-medium">If / Else</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">Logic</Badge>
            </CardHeader>

            <CardContent className="space-y-4 px-4 pb-4">
                <p className="text-xs text-muted-foreground truncate">
                    {data.label || 'Routes data.'}
                </p>

                <div className="bg-muted px-2 py-1.5 rounded-md text-xs font-mono text-center border border-border truncate">
                    {data.value1 || 'val1'} <span className="text-purple-500 font-bold">{data.operator || '=='}</span> {data.value2 || 'val2'}
                </div>

                <div className="flex flex-col gap-4 text-right text-xs font-semibold pr-2 mt-2">
                    <div className="text-green-600 dark:text-green-400">True</div>
                    <div className="text-red-600 dark:text-red-400">False</div>
                </div>
            </CardContent>

            <Handle
                type="source"
                position={Position.Right}
                id="true"
                style={{ top: '65%' }}
                className="w-5 h-5 bg-green-500 border-2 border-background cursor-crosshair transition-transform hover:scale-125"
            />

            <Handle
                type="source"
                position={Position.Right}
                id="false"
                style={{ top: '85%' }}
                className="w-5 h-5 bg-red-500 border-2 border-background cursor-crosshair transition-transform hover:scale-125"
            />
        </Card>
    );
}