import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Workflow, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/workflows', label: 'Workflows' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:glow transition-shadow">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Otto<span className="text-primary">flow</span>
          </span>
        </Link>

        {/* ── Nav links ────────────────────────────────────────── */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.to === '/'
                ? pathname === '/'
                : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/workflows/new">
            <Button size="sm" className="gap-1.5 hidden sm:inline-flex">
              <Workflow className="h-3.5 w-3.5" />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
