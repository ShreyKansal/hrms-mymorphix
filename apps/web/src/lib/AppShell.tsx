import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Tooltip } from 'radix-ui';
import { Building2, CalendarDays, ChevronRight, LogOut, Moon, Network, PanelLeft, Search, Shield, Sun, Users, Zap } from 'lucide-react';
import { useAuthStore } from '../modules/auth/store';
import { useThemeStore } from './theme';
import { usePageTitleStore } from './pageTitleStore';
import { CommandPalette, useCommandPaletteHotkey } from './CommandPalette';
import { Avatar } from '../components/ui/avatar';
import { cn } from './ui/cn';

// The Supabase Studio shell, built on the design system's Sidebar component
// (components/sidebar.md): a collapsible sidebar (⌘/Ctrl+B, persisted) that shrinks to an icon
// rail, with tooltips revealing labels when collapsed. Menu-button styling follows the DS —
// hover/active use the sidebar "accent" surface; the active item also carries a brand-green icon
// as a subtle sense of place. Beside it is a main column whose top bar carries the sidebar
// trigger, a breadcrumb trail, and the theme toggle.
//
// adminOnly is nav-visibility only, not enforcement — the real gate is server-side (RLS +
// SECURITY DEFINER RPCs) regardless of what's rendered.
const navItems = [
  { to: '/employees', label: 'Employees', icon: Users, adminOnly: false },
  { to: '/leave', label: 'Leave', icon: CalendarDays, adminOnly: false },
  { to: '/org-chart', label: 'Org Chart', icon: Network, adminOnly: false },
  { to: '/organisation', label: 'Organisation', icon: Building2, adminOnly: true },
  { to: '/team', label: 'Team', icon: Shield, adminOnly: true },
];

const SIDEBAR_STORAGE_KEY = 'hrms-sidebar';

const SidebarContext = createContext<{ collapsed: boolean; toggle: () => void }>({ collapsed: false, toggle: () => {} });
const useSidebar = () => useContext(SidebarContext);

function useSidebarState() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed';
    } catch {
      return false;
    }
  });
  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? 'collapsed' : 'expanded');
      } catch {
        /* storage disabled */
      }
      return next;
    });
  }, []);
  // ⌘/Ctrl+B toggles the sidebar (the design system's shortcut).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);
  return { collapsed, toggle };
}

function CollapseTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="z-[600] rounded-md border border-default bg-overlay px-2 py-1 text-xs font-medium text-foreground shadow-md"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function NavItem({ to, label, Icon }: { to: string; label: string; Icon: typeof Users }) {
  const { collapsed } = useSidebar();
  return (
    <CollapseTooltip label={label}>
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            'group flex h-8 items-center gap-2.5 rounded-md text-sm no-underline transition-colors',
            collapsed ? 'justify-center px-0' : 'px-2',
            isActive
              ? 'bg-surface-200 font-medium text-foreground'
              : 'font-normal text-foreground-light hover:bg-surface-200 hover:text-foreground',
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-brand' : 'text-foreground-lighter group-hover:text-foreground')} />
            {!collapsed && <span className="truncate">{label}</span>}
          </>
        )}
      </NavLink>
    </CollapseTooltip>
  );
}

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const { collapsed } = useSidebar();
  if (collapsed) {
    return (
      <CollapseTooltip label="Search  ⌘K">
        <button
          onClick={onOpen}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-control bg-foreground/[0.026] text-foreground-lighter transition-colors hover:border-strong hover:text-foreground"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </CollapseTooltip>
    );
  }
  return (
    <button
      onClick={onOpen}
      className="flex h-8 w-full items-center gap-2 rounded-md border border-control bg-foreground/[0.026] px-2.5 text-left transition-colors hover:border-strong"
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-foreground-lighter" />
      <span className="flex-1 truncate text-[13px] text-foreground-lighter">Search or jump to…</span>
      <kbd className="rounded border border-strong bg-surface-200 px-1.5 py-px text-[10px] font-medium text-foreground-lighter">⌘K</kbd>
    </button>
  );
}

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-foreground"
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function AccountFooter() {
  const { collapsed } = useSidebar();
  const signOut = useAuthStore((s) => s.signOut);
  const role = useAuthStore((s) => s.role);
  const email = useAuthStore((s) => s.session?.user.email ?? '');
  const name = email || 'Account';

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t border-default p-2">
        <CollapseTooltip label={email || 'Signed in'}>
          <span className="cursor-default">
            <Avatar name={name} size="sm" />
          </span>
        </CollapseTooltip>
        <CollapseTooltip label="Sign out">
          <button
            onClick={signOut}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </CollapseTooltip>
      </div>
    );
  }

  return (
    <div className="border-t border-default p-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-foreground">{email || 'Signed in'}</p>
          <p className="text-[11px] capitalize text-foreground-lighter">{role ?? 'member'}</p>
        </div>
        <button
          onClick={signOut}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-foreground"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Static path -> label map (this app uses the classic <BrowserRouter> + <Routes> API). The
// employee-detail route is the one dynamic case: its final segment is the record name.
const breadcrumbLabels: Record<string, string> = {
  '/employees': 'Employees',
  '/leave': 'Leave',
  '/organisation': 'Organisation',
  '/org-chart': 'Org Chart',
  '/team': 'Team',
};

function Crumb({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <span className={muted ? 'text-foreground-lighter' : 'text-foreground'}>{children}</span>;
}

function Sep() {
  return <ChevronRight className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden="true" />;
}

function Breadcrumbs() {
  const location = useLocation();
  const pageTitle = usePageTitleStore((s) => s.title);
  const tenantName = useAuthStore((s) => s.tenantName);
  const brandLabel = tenantName ? `${tenantName} HRMS` : 'HRMS';

  if (location.pathname === '/employees/new') {
    return (
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/employees" className="text-foreground-lighter transition-colors hover:text-foreground">
          Employees
        </Link>
        <Sep />
        <Crumb>Add employee</Crumb>
      </nav>
    );
  }

  if (/^\/employees\/[^/]+$/.test(location.pathname)) {
    return (
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/employees" className="text-foreground-lighter transition-colors hover:text-foreground">
          Employees
        </Link>
        <Sep />
        <Crumb>{pageTitle ?? '…'}</Crumb>
      </nav>
    );
  }

  const label = breadcrumbLabels[location.pathname];
  if (!label) return <div className="text-sm text-foreground-lighter">{brandLabel}</div>;
  return (
    <nav className="flex items-center gap-2 text-sm">
      <Crumb muted>{brandLabel}</Crumb>
      <Sep />
      <Crumb>{label}</Crumb>
    </nav>
  );
}

export default function AppShell() {
  const role = useAuthStore((s) => s.role);
  const { collapsed, toggle } = useSidebarState();
  const [paletteOpen, setPaletteOpen] = useState(false);
  useCommandPaletteHotkey(() => setPaletteOpen((o) => !o));

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <Tooltip.Provider delayDuration={0}>
        <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

          {/* Full-width top bar spanning the whole app; the sidebar opens beneath it. */}
          <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-default bg-background pl-3 pr-4">
            <Link to="/employees" className="flex items-center gap-2.5 no-underline">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground shadow-sm">
                <Zap className="h-4 w-4" fill="currentColor" strokeWidth={0} />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-foreground">HRMS</span>
            </Link>
            <button
              onClick={toggle}
              className="ml-1.5 flex h-8 w-8 items-center justify-center rounded-md text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-foreground"
              aria-label="Toggle sidebar"
              title="Toggle sidebar  ⌘B"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="mx-1 h-4 w-px bg-border" />
            <div className="min-w-0 flex-1">
              <Breadcrumbs />
            </div>
            <ThemeToggle />
          </header>

          {/* Body: sidebar (beneath the top bar) + content. */}
          <div className="flex min-h-0 flex-1">
            <aside
              className="flex shrink-0 flex-col overflow-hidden border-r border-default bg-alternative transition-[width] duration-200 ease-in-out"
              style={{ width: collapsed ? '3.25rem' : '15rem' }}
            >
              <div className={cn('pb-2 pt-3', collapsed ? 'flex justify-center px-2' : 'px-3')}>
                <SearchTrigger onOpen={() => setPaletteOpen(true)} />
              </div>

              <nav className={cn('flex-1 overflow-y-auto py-2', collapsed ? 'px-2' : 'px-3')}>
                {!collapsed && (
                  <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">Manage</p>
                )}
                <div className="flex flex-col gap-0.5">
                  {navItems
                    .filter((item) => !item.adminOnly || role === 'admin')
                    .map((item) => (
                      <NavItem key={item.to} to={item.to} label={item.label} Icon={item.icon} />
                    ))}
                </div>
              </nav>

              <AccountFooter />
            </aside>

            <main className="min-w-0 flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </Tooltip.Provider>
    </SidebarContext.Provider>
  );
}
