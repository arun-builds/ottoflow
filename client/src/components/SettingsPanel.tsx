import { useEffect, useState } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPanel({
    selectedNodeId,
    onClose
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

    const updateData = (key: string, value: string) => {
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === node.id) {
                    const updatedNode = { ...n, data: { ...n.data, [key]: value } };
                    setNode(updatedNode);
                    return updatedNode;
                }
                return n;
            })
        );
    };

    return (
        <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] border-l sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Node Settings</SheetTitle>
                    <SheetDescription className="capitalize">
                        Configure parameters for the {node.type} node.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="label">Label</Label>
                        <Input
                            id="label"
                            value={(node.data.label as string) || ''}
                            onChange={(e) => updateData('label', e.target.value)}
                        />
                    </div>

                    {node.type === 'email' && (
                        <div className="rounded-lg border bg-muted/30 space-y-4 p-4">
                            <div className="font-medium text-sm">Email Configuration</div>

                            <div className="grid gap-2">
                                <Label htmlFor="to">To</Label>
                                <Input
                                    id="to"
                                    placeholder="user@example.com"
                                    value={(node.data.to as string) || ''}
                                    onChange={(e) => updateData('to', e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="New commit in {{webhook.repository.name}}"
                                    value={(node.data.subject as string) || ''}
                                    onChange={(e) => updateData('subject', e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="body">Body</Label>
                                <Textarea
                                    id="body"
                                    rows={5}
                                    placeholder="Author: {{webhook.head_commit.author.name}}&#10;Message: {{webhook.head_commit.message}}"
                                    value={(node.data.body as string) || ''}
                                    onChange={(e) => updateData('body', e.target.value)}
                                    className="font-mono text-xs"
                                />
                            </div>
                        </div>
                    )}

                    {node.type === 'if' && (
                        <div className="rounded-lg border bg-muted/30 space-y-4 p-4">
                            <div className="font-medium text-sm">Condition</div>

                            <div className="grid gap-2">
                                <Label htmlFor="value1" className="text-xs">Value 1</Label>
                                <Input
                                    id="value1"
                                    placeholder="{{ $json.amount }}"
                                    value={(node.data.value1 as string) || ''}
                                    onChange={(e) => updateData('value1', e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs">Operator</Label>
                                <Select
                                    value={(node.data.operator as string) || '=='}
                                    onValueChange={(val) => updateData('operator', val || '==')}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="==">Equals (==)</SelectItem>
                                        <SelectItem value="!=">Not Equals (!=)</SelectItem>
                                        <SelectItem value=">">Greater Than (&gt;)</SelectItem>
                                        <SelectItem value="<">Less Than (&lt;)</SelectItem>
                                        <SelectItem value=">=">Greater or Equal (&gt;=)</SelectItem>
                                        <SelectItem value="<=">Less or Equal (&lt;=)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="value2" className="text-xs">Value 2</Label>
                                <Input
                                    id="value2"
                                    placeholder="1000"
                                    value={(node.data.value2 as string) || ''}
                                    onChange={(e) => updateData('value2', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {node.type === 'log' && (
                        <div className="grid gap-2">
                            <Label htmlFor="message">Log Message</Label>
                            <Input
                                id="message"
                                placeholder="{{ $json }}"
                                value={(node.data.message as string) || ''}
                                onChange={(e) => updateData('message', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
