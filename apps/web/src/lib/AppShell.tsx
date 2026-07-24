import { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import Button from '@atlaskit/button/new';
import { token } from '@atlaskit/tokens';
import { useAuthStore } from '../modules/auth/store';
import { usePageTitleStore } from './pageTitleStore';
import { CommandPalette, useCommandPaletteHotkey } from './CommandPalette';

// Inlined rather than imported from @atlaskit/icon/glyph/*: this Vite/Rolldown version's CJS
// interop for those deep subpath imports wraps the default export incorrectly (the module's
// default export ends up being the whole {__esModule, default: Component} object, not the
// component itself — confirmed by inspecting the actual pre-bundled dep output, not guessed),
// so React throws "Element type is invalid" for every one of them identically. The markup below
// is copied verbatim from @atlaskit/icon's own compiled glyph output, so it's pixel-identical
// to what the real components would have rendered — this sidesteps the broken interop path
// entirely rather than fighting it.
function IconSvg({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" role="presentation" style={{ flexShrink: 0 }}>
      <g fill="currentcolor" fillRule="evenodd" dangerouslySetInnerHTML={{ __html: path }} />
    </svg>
  );
}
const PersonIcon = () => (
  <IconSvg path='<path d="M6 14c0-1.105.902-2 2.009-2h7.982c1.11 0 2.009.894 2.009 2.006v4.44c0 3.405-12 3.405-12 0z"/><circle cx="12" cy="7" r="4"/>' />
);
const OfficeBuildingIcon = () => (
  <IconSvg path='<path fill-rule="nonzero" d="M8 6H5.009C3.902 6 3 6.962 3 8.15v10.7C3 20.04 3.9 21 5.009 21h5.487H8v-2.145c-1.616-.001-3-.003-3-.004 0 0 .005-10.708.009-10.708L8 8.144z"/><path d="M12 7h2v2h-2zm-6 3h2v2H6zm0 3h2v2H6zm6-3h2v2h-2zm0 3h2v2h-2zm2 3h2v3h-2zm2-9h2v2h-2zm0 3h2v2h-2zm0 3h2v2h-2z"/><path fill-rule="nonzero" d="M18.991 19C18.998 19 19 4.995 19 4.995c0 .006-7.991.005-7.991.005C11.002 5 11 19 11 19zM9 4.995C9 3.893 9.902 3 11.009 3h7.982C20.101 3 21 3.893 21 4.995v14.01A2.004 2.004 0 0 1 18.991 21H9z"/>' />
);
const PeopleGroupIcon = () => (
  <IconSvg path='<path d="M8.13 10H4a2 2 0 0 0-2 2v3.73c0 1.31 1.87 2.05 4 2.23V15a3 3 0 0 1 3-3h.35a4 4 0 0 1-1.23-2m7.75 0H20c1.11 0 2 .89 2 2v3.73c0 1.31-1.87 2.05-4 2.23V15a3 3 0 0 0-3-3h-.35a4 4 0 0 0 1.23-2M9.97 5.55a3 3 0 1 0-1.96 3.27 4 4 0 0 1 1.96-3.27M16 8.83a3 3 0 1 0-1.96-3.28A4 4 0 0 1 16 8.83"/><path d="M7 15c0-1.105.887-2 2-2h6c1.105 0 2 .885 2 2v3.73c0 3.027-10 3.027-10 0z"/><circle cx="12" cy="9" r="3"/>' />
);
const TeamsIcon = () => (
  <IconSvg path='<path fill-rule="evenodd" d="M9 7.2a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0m1.8 0a3.6 3.6 0 1 1-7.2 0 3.6 3.6 0 0 1 7.2 0m7.8 0a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0m1.8 0a3.6 3.6 0 1 1-7.2 0 3.6 3.6 0 0 1 7.2 0m1.2 9.3a4.5 4.5 0 0 0-4.5-4.5h-1.378c-.484 0-1.275.127-1.875.41l.77 1.627c.14-.066.342-.129.566-.174s.421-.063.539-.063H17.1a2.7 2.7 0 0 1 2.7 2.7V18a.6.6 0 0 1-.6.6h-3.478a2.7 2.7 0 0 1-2.538-1.777l-.676-1.86A4.5 4.5 0 0 0 8.278 12H6.9a4.5 4.5 0 0 0-4.5 4.5V18a2.4 2.4 0 0 0 2.4 2.4h4.8v-1.8H4.8a.6.6 0 0 1-.6-.6v-1.5a2.7 2.7 0 0 1 2.7-2.7h1.378a2.7 2.7 0 0 1 2.538 1.777l.676 1.86a4.5 4.5 0 0 0 4.23 2.963H19.2a2.4 2.4 0 0 0 2.4-2.4z" clip-rule="evenodd"/>' />
);
const SearchIcon = () => (
  <IconSvg path='<path fill-rule="evenodd" d="M10.5 3a7.5 7.5 0 1 0 4.55 13.46l4.245 4.244a1 1 0 0 0 1.414-1.414l-4.243-4.244A7.5 7.5 0 0 0 10.5 3M5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0" clip-rule="evenodd"/>' />
);

// Layout route (wraps every authenticated+tenanted page via <Outlet/>) rather than each page
// managing its own header/back-link — added once real navigation started accumulating across
// modules (Employees, Organisation, Org Chart) with no consistent way to move between them or
// sign out. Nav items grow as modules do; this file doesn't need touching per new page, just
// per new top-level destination.
//
// adminOnly here is nav-visibility only, not enforcement — hiding a link is UX, not security
// (Module 21 PRD's own framing principle). The real gate is server-side: invite_user() checks
// the caller's role itself, RLS scopes what a non-admin can read/write regardless of what's
// rendered. Same reasoning for the Add employee/Transfer buttons gated elsewhere.
const navItems = [
  { to: '/employees', label: 'Employees', icon: PersonIcon, adminOnly: false },
  { to: '/organisation', label: 'Organisation', icon: OfficeBuildingIcon, adminOnly: true },
  { to: '/org-chart', label: 'Org Chart', icon: PeopleGroupIcon, adminOnly: false },
  { to: '/team', label: 'Team', icon: TeamsIcon, adminOnly: true },
];

// One reusable "does this element have hover feedback" pattern for an inline-style-only
// codebase (no CSS files anywhere, so no :hover pseudo-class without either this or a new
// global stylesheet — this is the smaller addition of the two). Used by both nav items and
// search results rather than duplicating the same onMouseEnter/onMouseLeave dance twice.
function useHover() {
  const [hovered, setHovered] = useState(false);
  return { hovered, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) };
}

function NavItem({ to, label, Icon }: { to: string; label: string; Icon: () => JSX.Element }) {
  const { hovered, onMouseEnter, onMouseLeave } = useHover();
  return (
    <NavLink
      to={to}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 4,
        textDecoration: 'none',
        color: isActive ? token('color.text.selected', '#0C66E4') : token('color.text', '#172B4D'),
        background: isActive
          ? token('color.background.selected', '#E9F2FF')
          : hovered
            ? token('color.background.neutral.subtle.hovered', '#F1F2F4')
            : 'transparent',
        fontWeight: isActive ? 600 : 400,
      })}
    >
      <Icon />
      {label}
    </NavLink>
  );
}

// A trigger, not a live-filtering input in place — the actual search UI is the centered
// CommandPalette modal (see that file's comment for why the first version of this, an
// under-the-input dropdown, wasn't the right pattern at all). This button just looks like a
// search field and opens it, matching how ClickUp/Attio/Linear's own sidebar search entries
// work — clicking (or Cmd/Ctrl+K) opens the palette; nothing is typed here directly.
function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const { hovered, onMouseEnter, onMouseLeave } = useHover();
  return (
    <button
      onClick={onOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 32,
        padding: '0 8px',
        marginBottom: 16,
        borderRadius: 6,
        border: `1px solid ${token('color.border', '#DCDFE4')}`,
        backgroundColor: hovered ? token('color.background.neutral.subtle.hovered', '#F1F2F4') : token('elevation.surface', '#FFFFFF'),
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        font: 'inherit',
      }}
    >
      <span style={{ color: token('color.icon.subtle', '#626F86'), display: 'flex' }}>
        <SearchIcon />
      </span>
      <span style={{ flex: 1, fontSize: 13, color: token('color.text.subtlest', '#8590A2') }}>Search employees…</span>
      <kbd
        style={{
          fontSize: 11,
          color: token('color.text.subtlest', '#8590A2'),
          border: `1px solid ${token('color.border', '#DCDFE4')}`,
          borderRadius: 3,
          padding: '1px 4px',
          fontFamily: 'inherit',
        }}
      >
        ⌘K
      </kbd>
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
      <div style={{ fontSize: 14, color: '#44546F' }}>
        <Link to="/employees" style={{ color: '#44546F' }}>
          Employees
        </Link>
        {' / '}
        <span style={{ color: '#172B4D', fontWeight: 500 }}>Add employee</span>
      </div>
    );
  }

  if (/^\/employees\/[^/]+$/.test(location.pathname)) {
    return (
      <div style={{ fontSize: 14, color: '#44546F' }}>
        <Link to="/employees" style={{ color: '#44546F' }}>
          Employees
        </Link>
        {' / '}
        <span style={{ color: '#172B4D', fontWeight: 500 }}>{pageTitle ?? '…'}</span>
      </div>
    );
  }

  const label = breadcrumbLabels[location.pathname];
  if (!label) return null;
  return <div style={{ fontSize: 14, fontWeight: 500, color: '#172B4D' }}>{label}</div>;
}

export default function AppShell() {
  const signOut = useAuthStore((s) => s.signOut);
  const role = useAuthStore((s) => s.role);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useCommandPaletteHotkey(() => setPaletteOpen((o) => !o));

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <aside
        style={{
          width: 232,
          flexShrink: 0,
          borderRight: `1px solid ${token('color.border', '#DCDFE4')}`,
          backgroundColor: token('elevation.surface.sunken', '#F7F8F9'),
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: token('color.background.brand.bold', '#0C66E4'),
              color: token('color.text.inverse', '#FFFFFF'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            H
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: token('color.text', '#172B4D') }}>HRMS</span>
        </div>

        <SearchTrigger onOpen={() => setPaletteOpen(true)} />

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems
            .filter((item) => !item.adminOnly || role === 'admin')
            .map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} Icon={item.icon} />
            ))}
        </nav>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            borderBottom: '1px solid #DCDFE4',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Breadcrumbs />
          <Button appearance="subtle" onClick={signOut}>
            Sign out
          </Button>
        </header>
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
