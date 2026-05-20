import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Webhook } from 'lucide-react';

export default function WebhookNode({ data }: { data: any }) {
  return (
    <Card className="w-[300px] border-2 border-blue-500/20 shadow-md bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-400">
            <Webhook size={16} />
          </div>
          <CardTitle className="text-sm font-medium">Webhook Trigger</CardTitle>
        </div>
        <Badge variant="secondary" className="text-xs">Trigger</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {data.label || 'Listens for incoming HTTP POST requests.'}
        </p>
      </CardContent>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="main"
        className="w-3 h-3 bg-blue-500 border-2 border-background"
      />
    </Card>
  );
}