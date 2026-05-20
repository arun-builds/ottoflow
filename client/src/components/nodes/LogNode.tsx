import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal } from 'lucide-react';

export default function LogNode({ data }: { data: any }) {
    return (
        <Card className="w-60 border border-border shadow-sm bg-card">
            <Handle
                type="target"
                position={Position.Left}
                id="main"
                className="w-5 h-5 bg-muted-foreground border-2 border-background cursor-crosshair transition-transform hover:scale-125 hover:bg-primary"
            />

            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-muted rounded-md text-foreground">
                        <Terminal size={14} />
                    </div>
                    <CardTitle className="text-sm font-medium">Log</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">Action</Badge>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <p className="text-xs text-muted-foreground truncate">
                    {data.label || 'Logs data to console.'}
                </p>
            </CardContent>

            <Handle
                type="source"
                position={Position.Right}
                id="main"
                className="w-5 h-5 bg-muted-foreground border-2 border-background cursor-crosshair transition-transform hover:scale-125 hover:bg-primary"
            />
        </Card>
    );
}