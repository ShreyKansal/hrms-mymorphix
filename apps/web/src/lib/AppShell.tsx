import { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Building2, Network, Search, Users } from 'lucide-react';
import { useAuthStore } from '../modules/auth/store';
import { usePageTitleStore } from './pageTitleStore';
import { CommandPalette, useCommandPaletteHotkey } from './CommandPalette';
import { Button } from '../components/ui/button';
import { cn } from './ui/cn';

// Migrated off @atlaskit/icon (the inlined-SVG workaround for its Vite/Rolldown CJS-interop
// bug — see git history — is now moot; lucide-react is a different package with no such issue)
// and off inline styles + a hand-rolled useHover() JS pattern for hover feedback (Tailwind's
// real :hover pseudo-class does that natively once actual CSS exists, which it now does).
//
// adminOnly here is nav-visibility only, not enforcement — hiding a link is UX, not security
// (Module 21 PRD's own framing principle). The real gate is server-side: invite_user() checks
// the caller's role itself, RLS scopes what a non-admin can read/write regardless of what's
// rendered. Same reasoning for the Add employee/Transfer buttons gated elsewhere.
const navItems = [
  { to: '/employees', label: 'Employees', icon: Users, adminOnly: false },
  { to: '/organisation', label: 'Organisation', icon: Building2, adminOnly: true },
  { to: '/org-chart', label: 'Org Chart', icon: Network, adminOnly: false },
  { to: '/team', label: 'Team', icon: Users, adminOnly: true },
];

function NavItem({ to, label, Icon }: { to: string; label: string; Icon: typeof Users }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded px-2 py-1.5 text-sm no-underline transition-colors',
          isActive ? 'bg-selected-bg font-semibold text-selected' : 'font-normal text-foreground hover:bg-neutral-hover',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

// A trigger, not a live-filtering input in place — the actual search UI is the centered
// CommandPalette modal. Clicking (or Cmd/Ctrl+K) opens it; nothing is typed here directly.
function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="mb-4 flex h-8 w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 text-left font-sans hover:bg-neutral-hover"
    >
      <Search className="h-4 w-4 shrink-0 text-text-subtle" />
      <span className="flex-1 text-[13px] text-text-subtlest">Search employees…</span>
      <kbd className="rounded border border-border px-1 py-px text-[11px] text-text-subtlest">⌘K</kbd>
    </button>
  );
}

// Static path -> label map, not React Router's `handle`/`useMatches` — this app uses the
// classic <BrowserRouter> + <Routes> API, and useMatches() only works with the "data router"
// (createBrowserRouter/RouterProvider), a bigger migration than a breadcrumb trail justifies
// right now. A plain path lookup does the same job for a route tree this size.
const breadcrumbLabels: Record<string, string> = {
  '/employees': 'Employees',
  '/organisation': 'Organisation',
  '/org-chart': 'Org Chart',
  '/team': 'Team',
};

// Breadcrumbs live here — one horizontal trail in the top bar reflecting the current route —
// rather than each page inventing its own "<- back to X" link. The employee-detail route is
// the one dynamic case: its final segment is the actual record name, supplied via
// usePageTitleStore rather than AppShell running its own duplicate fetch just to know it.
function Breadcrumbs() {
  const location = useLocation();
  const pageTitle = usePageTitleStore((s) => s.title);

  if (location.pathname === '/employees/new') {
    return (
      <div className="text-sm text-text-subtle">
        <Link to="/employees" className="text-text-subtle">
          Employees
        </Link>
        {' / '}
        <span className="font-medium text-foreground">Add employee</span>
      </div>
    );
  }

  if (/^\/employees\/[^/]+$/.test(location.pathname)) {
    return (
      <div className="text-sm text-text-subtle">
        <Link to="/employees" className="text-text-subtle">
          Employees
        </Link>
        {' / '}
        <span className="font-medium text-foreground">{pageTitle ?? '…'}</span>
      </div>
    );
  }

  const label = breadcrumbLabels[location.pathname];
  if (!label) return null;
  return <div className="text-sm font-medium text-foreground">{label}</div>;
}

export default function AppShell() {
  const signOut = useAuthStore((s) => s.signOut);
  const role = useAuthStore((s) => s.role);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useCommandPaletteHotkey(() => setPaletteOpen((o) => !o));

  return (
    <div className="flex min-h-screen">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-border bg-sunken p-4">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">H</div>
          <span className="text-[15px] font-bold text-foreground">HRMS</span>
        </div>

        <SearchTrigger onOpen={() => setPaletteOpen(true)} />

        <nav className="flex flex-col gap-1">
          {navItems
            .filter((item) => !item.adminOnly || role === 'admin')
            .map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} Icon={item.icon} />
            ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-2.5">
          <Breadcrumbs />
          <Button variant="ghost" size="small" onClick={signOut}>
            Sign out
          </Button>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
