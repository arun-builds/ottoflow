import { Link } from 'react-router-dom';
import { Webhook, GitBranch, Mail, LayoutDashboard } from 'lucide-react';

export default function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 border-r border-border bg-card p-4 flex flex-col gap-4 shadow-sm z-10">
            <Link to="/" className="flex items-center gap-2 mb-2 px-1">
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-bold text-lg">Ottoflow</span>
            </Link>

            <div className="font-semibold text-sm text-muted-foreground mb-2">Node Palette</div>

            <div
                className="p-3 border rounded-md cursor-grab active:cursor-grabbing bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 flex items-center gap-3 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40"
                onDragStart={(e) => onDragStart(e, 'webhook')}
                draggable
            >
                <Webhook size={18} className="text-blue-500" />
                <span className="text-sm font-medium">Webhook</span>
            </div>

            <div
                className="p-3 border rounded-md cursor-grab active:cursor-grabbing bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 flex items-center gap-3 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                onDragStart={(e) => onDragStart(e, 'email')}
                draggable
            >
                <Mail size={18} className="text-emerald-500" />
                <span className="text-sm font-medium">Send Email</span>
            </div>

            <div
                className="p-3 border rounded-md cursor-grab active:cursor-grabbing bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 flex items-center gap-3 transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/40"
                onDragStart={(e) => onDragStart(e, 'if')}
                draggable
            >
                <GitBranch size={18} className="text-purple-500" />
                <span className="text-sm font-medium">If / Else</span>
            </div>
        </aside>
    );
}
