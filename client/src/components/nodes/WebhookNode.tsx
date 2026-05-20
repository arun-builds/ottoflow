import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Webhook } from 'lucide-react';

export default function WebhookNode({ data }: { data: any }) {
  return (
    <Card className="w-60 border-2 border-blue-500/20 shadow-md bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-400">
            <Webhook size={14} />
          </div>
          <CardTitle className="text-sm font-medium">Webhook</CardTitle>
        </div>
        <Badge variant="secondary" className="text-[10px]">Trigger</Badge>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-xs text-muted-foreground truncate">
          {data.label || 'Listens for POST requests.'}
        </p>
      </CardContent>

      {/* Much larger, reactive handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="main"
        className="w-5 h-5 bg-blue-500 border-2 border-background cursor-crosshair transition-transform hover:scale-125"
      />
    </Card>
  );
}