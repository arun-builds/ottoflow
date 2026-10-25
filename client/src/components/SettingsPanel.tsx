import { useEffect, useState } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Webhook,
  Mail,
  GitBranch,
  Globe,
  FileText,
  Trash2,
} from 'lucide-react';

const nodeIcons: Record<string, typeof Webhook> = {
  webhook: Webhook,
  email: Mail,
  if: GitBranch,
  http: Globe,
  log: FileText,
};

const nodeColors: Record<string, string> = {
  webhook: 'text-blue-400',
  email: 'text-emerald-400',
  if: 'text-purple-400',
  http: 'text-amber-400',
  log: 'text-cyan-400',
};

export default function SettingsPanel({
  selectedNodeId,
  onClose,
}: {
  selectedNodeId: string | null;
  onClose: () => void;
}) {
  const { getNodes, setNodes } = useReactFlow();
  const [node, setNode] = useState<Node | null>(null);

  useEffect(() => {
    if (selectedNodeId) {
      const foundNode = getNodes().find((n) => n.id === selectedNodeId);
      setNode(foundNode || null);
    } else {
      setNode(null);
    }
  }, [selectedNodeId, getNodes]);

  if (!node) return null;

  const updateData = (key: string, value: unknown) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          const updated = {
            ...n,
            data: {
              ...n.data,
              [key]: value,
            },
          };
          setNode(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const handleDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== node.id));
    onClose();
  };

  const Icon = nodeIcons[node.type || ''] || FileText;
  const colorClass = nodeColors[node.type || ''] || 'text-primary';

  return (
    <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
              <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
            <div>
              <SheetTitle className="capitalize text-sm">
                {(node.data.label as string) || `${node.type} Node`}
              </SheetTitle>
              <SheetDescription className="text-xs">
                Configure properties and variables
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Separator className="mb-4" />

        <div className="space-y-4">
          {/* ── Label ──────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="label" className="text-xs">
              Node Label
            </Label>
            <Input
              id="label"
              value={(node.data.label as string) || ''}
              onChange={(e) => updateData('label', e.target.value)}
              className="bg-background text-xs"
            />
          </div>

          {/* ── Webhook ────────────────────────────────────────────── */}
          {node.type === 'webhook' && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
              <div className="text-xs font-semibold text-blue-400">
                Trigger Details
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This node starts your workflow when an external HTTP POST request arrives. The request body is injected into context at <code className="text-blue-400 font-mono text-[10px]">{'{{webhook.<field>}}'}</code>.
              </p>
            </div>
          )}

          {/* ── Email ──────────────────────────────────────────────── */}
          {node.type === 'email' && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-3 p-3">
              <div className="text-xs font-semibold text-emerald-400">
                Email Settings
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to" className="text-xs">
                  Recipient (To)
                </Label>
                <Input
                  id="to"
                  placeholder="recipient@example.com"
                  value={(node.data.to as string) || ''}
                  onChange={(e) => updateData('to', e.target.value)}
                  className="bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs">
                  Subject
                </Label>
                <Input
                  id="subject"
                  placeholder="Notification: {{webhook.event}}"
                  value={(node.data.subject as string) || ''}
                  onChange={(e) => updateData('subject', e.target.value)}
                  className="bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="body" className="text-xs">
                  Body Template
                </Label>
                <Textarea
                  id="body"
                  rows={3}
                  placeholder="Hello, {{webhook.name}}..."
                  value={(node.data.body as string) || ''}
                  onChange={(e) => updateData('body', e.target.value)}
                  className="bg-background text-xs"
                />
              </div>
            </div>
          )}

          {/* ── If / Condition ─────────────────────────────────────── */}
          {node.type === 'if' && (
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-3 p-3">
              <div className="text-xs font-semibold text-purple-400">
                Condition Logic
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="value1" className="text-xs">
                  Left Value
                </Label>
                <Input
                  id="value1"
                  placeholder="{{webhook.amount}}"
                  value={(node.data.value1 as string) || ''}
                  onChange={(e) => updateData('value1', e.target.value)}
                  className="bg-background font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="operator" className="text-xs">
                  Operator
                </Label>
                <Select
                  value={(node.data.operator as string) || '=='}
                  onValueChange={(val) => updateData('operator', val)}
                >
                  <SelectTrigger id="operator" className="bg-background text-xs">
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="==">== (Equals)</SelectItem>
                    <SelectItem value="!=">!= (Not equals)</SelectItem>
                    <SelectItem value=">">&gt; (Greater than)</SelectItem>
                    <SelectItem value="<">&lt; (Less than)</SelectItem>
                    <SelectItem value=">=">&gt;= (Greater or equal)</SelectItem>
                    <SelectItem value="<=">&lt;= (Less or equal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="value2" className="text-xs">
                  Right Value
                </Label>
                <Input
                  id="value2"
                  placeholder="100"
                  value={(node.data.value2 as string) || ''}
                  onChange={(e) => updateData('value2', e.target.value)}
                  className="bg-background font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* ── HTTP ───────────────────────────────────────────────── */}
          {node.type === 'http' && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-3 p-3">
              <div className="text-xs font-semibold text-amber-400">
                HTTP Request
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="method" className="text-xs">
                  Method
                </Label>
                <Select
                  value={(node.data.method as string) || 'GET'}
                  onValueChange={(val) => updateData('method', val)}
                >
                  <SelectTrigger id="method" className="bg-background text-xs">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="url" className="text-xs">
                  URL
                </Label>
                <Input
                  id="url"
                  placeholder="https://api.example.com/endpoint"
                  value={(node.data.url as string) || ''}
                  onChange={(e) => updateData('url', e.target.value)}
                  className="bg-background font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="httpBody" className="text-xs">
                  Body (JSON)
                </Label>
                <Textarea
                  id="httpBody"
                  rows={3}
                  placeholder={'{\n  "key": "{{webhook.value}}"\n}'}
                  value={(node.data.body as string) || ''}
                  onChange={(e) => updateData('body', e.target.value)}
                  className="font-mono text-xs bg-background"
                />
              </div>
            </div>
          )}

          {/* ── Log ────────────────────────────────────────────────── */}
          {node.type === 'log' && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 space-y-3 p-3">
              <div className="text-xs font-semibold text-cyan-400">
                Log Configuration
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs">
                  Log Message
                </Label>
                <Input
                  id="message"
                  placeholder="{{ $json }}"
                  value={(node.data.message as string) || ''}
                  onChange={(e) => updateData('message', e.target.value)}
                  className="bg-background font-mono text-xs"
                />
              </div>
            </div>
          )}

          <Separator />

          {/* ── Delete Node Action ─────────────────────────────────── */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="w-full gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Node
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
