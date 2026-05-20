import { useEffect, useState } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPanel({
    selectedNodeId,
    onClose
}: {
    selectedNodeId: string | null;
    onClose: () => void;
}) {
    const { getNodes, setNodes } = useReactFlow();
    const [node, setNode] = useState<Node | null>(null);

    // Sync the local component state with the canvas node whenever the selection changes
    useEffect(() => {
        if (selectedNodeId) {
            const foundNode = getNodes().find((n) => n.id === selectedNodeId);
            setNode(foundNode || null);
        } else {
            setNode(null);
        }
    }, [selectedNodeId, getNodes]);

    if (!node) return null;

    // Helper to instantly update the React Flow state and our local state
    const updateData = (key: string, value: string | null | undefined) => {
        const safeValue = value || '';
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === node.id) {
                    const updatedNode = { ...n, data: { ...n.data, [key]: safeValue } };
                    setNode(updatedNode); // Update local form state
                    return updatedNode;   // Update canvas state
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
                    {/* Universal Field: Every node has a label */}
                    <div className="grid gap-2">
                        <Label htmlFor="label">Node Label</Label>
                        <Input
                            id="label"
                            value={(node.data.label as string) || ''}
                            onChange={(e) => updateData('label', e.target.value)}
                        />
                    </div>

                    {/* Conditional Fields: Only show for If/Else Nodes */}
                    {node.type === 'if' && (
                        <div className="p-4 rounded-md border bg-muted/30 space-y-4">
                            <div className="font-medium text-sm">Logic Condition</div>

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
                                    onValueChange={(val) => updateData('operator', val)}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select an operator" />
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
                </div>
            </SheetContent>
        </Sheet>
    );
}