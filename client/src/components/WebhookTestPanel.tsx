import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function WebhookTestPanel() {
    const [payload, setPayload] = useState('{\n  "user": "Arun",\n  "action": "test"\n}');
    const [status, setStatus] = useState<'idle' | 'firing' | 'success' | 'error'>('idle');

    // Hardcoded for testing. Later, this will use the saved workflow's ID.
    const webhookUrl = 'http://localhost:8081/webhook/wf_111673fe1abe8431';

    const fireWebhook = async () => {
        setStatus('firing');
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
            });

            if (!res.ok) throw new Error('Webhook failed');
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="absolute bottom-6 left-6 w-80 bg-card border border-border rounded-lg shadow-lg flex flex-col z-10 overflow-hidden">
            <div className="px-4 py-2 bg-muted/50 border-b border-border text-sm font-semibold text-foreground flex justify-between items-center">
                <span>Test Webhook Trigger</span>
                {status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
            </div>

            <div className="p-4 space-y-3">
                <textarea
                    className="w-full h-28 p-2 bg-background text-foreground font-mono text-xs rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                />

                <Button
                    onClick={fireWebhook}
                    disabled={status === 'firing'}
                    className="w-full"
                    size="sm"
                >
                    {status === 'firing' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Play className="w-4 h-4 mr-2" />
                    )}
                    {status === 'firing' ? 'Firing...' : 'Fire Webhook'}
                </Button>
            </div>
        </div>
    );
}