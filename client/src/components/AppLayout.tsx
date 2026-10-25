import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function AppLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
}
