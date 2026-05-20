import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch } from 'lucide-react';

export default function IfNode({ data }: { data: any }) {
    return (
        <Card className="w-[300px] border border-border shadow-sm bg-card relative">
            {/* Input Handle (Left) */}
            <Handle
                type="target"
                position={Position.Left}
                id="main"
                className="w-3 h-3 bg-muted-foreground border-2 border-background"
            />

            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-md text-purple-600 dark:text-purple-400">
                        <GitBranch size={16} />
                    </div>
                    <CardTitle className="text-sm font-medium">If / Else</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">Logic</Badge>
            </CardHeader>

            <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                    {data.label || 'Routes data based on a condition.'}
                </p>

                {/* Condition Preview (e.g., amount > 100) */}
                <div className="bg-muted px-3 py-2 rounded-md text-xs font-mono text-center border border-border">
                    {data.value1 || 'value1'} <span className="text-purple-500 font-bold">{data.operator || '=='}</span> {data.value2 || 'value2'}
                </div>

                {/* Labels for the outputs so the user knows which handle is which */}
                <div className="flex flex-col gap-5 text-right text-xs font-semibold pr-2 mt-2">
                    <div className="text-green-600 dark:text-green-400">True</div>
                    <div className="text-red-600 dark:text-red-400">False</div>
                </div>
            </CardContent>

            {/* Output Handle 1: True */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                style={{ top: '136px' }} // Align with the "True" text
                className="w-3 h-3 bg-green-500 border-2 border-background"
            />

            {/* Output Handle 2: False */}
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                style={{ top: '172px' }} // Align with the "False" text
                className="w-3 h-3 bg-red-500 border-2 border-background"
            />
        </Card>
    );
}