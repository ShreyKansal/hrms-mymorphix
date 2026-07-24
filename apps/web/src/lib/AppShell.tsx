import { NavLink, Outlet } from 'react-router-dom';
import Button from '@atlaskit/button/new';
import { useAuthStore } from '../modules/auth/store';

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
  { to: '/employees', label: 'Employees', adminOnly: false },
  { to: '/organisation', label: 'Organisation', adminOnly: true },
  { to: '/org-chart', label: 'Org Chart', adminOnly: false },
  { to: '/team', label: 'Team', adminOnly: true },
];

export default function AppShell() {
  const signOut = useAuthStore((s) => s.signOut);
  const role = useAuthStore((s) => s.role);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, flexShrink: 0, borderRight: '1px solid #DCDFE4', padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>HRMS</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems
            .filter((item) => !item.adminOnly || role === 'admin')
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  padding: '6px 8px',
                  borderRadius: 4,
                  textDecoration: 'none',
                  color: isActive ? '#0C66E4' : '#172B4D',
                  background: isActive ? '#E9F2FF' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            borderBottom: '1px solid #DCDFE4',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
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
