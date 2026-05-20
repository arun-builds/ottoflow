import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal } from 'lucide-react';

export default function LogNode({ data }: { data: any }) {
    return (
        <Card className="w-[300px] border border-border shadow-sm bg-card">
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                id="main"
                className="w-3 h-3 bg-muted-foreground border-2 border-background"
            />

            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-md text-foreground">
                        <Terminal size={16} />
                    </div>
                    <CardTitle className="text-sm font-medium">Console Log</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">Action</Badge>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">
                    {data.label || 'Logs data to the engine console.'}
                </p>
            </CardContent>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="main"
                className="w-3 h-3 bg-muted-foreground border-2 border-background"
            />
        </Card>
    );
}