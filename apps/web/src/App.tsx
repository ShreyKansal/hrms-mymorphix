import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './modules/auth/store';
import Auth from './modules/auth/Auth';
import TenantSetup from './modules/auth/TenantSetup';
import EmployeeDirectory from './modules/core-hr/EmployeeDirectory';
import EmployeeDetail from './modules/core-hr/EmployeeDetail';
import OrgChart from './modules/core-hr/OrgChart';
import OrgManagement from './modules/org-management/OrgManagement';
import Team from './modules/roles-permissions/Team';
import AppShell from './lib/AppShell';

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuthStore();
  if (loading) return null; // avoid a flash-redirect while the session is still resolving
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RequireTenant({ children }: { children: ReactNode }) {
  const { tenantId, loading } = useAuthStore();
  if (loading) return null;
  if (!tenantId) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

export default function App() {
  const initialise = useAuthStore((s) => s.initialise);
  const { session, tenantId, loading } = useAuthStore();

  useEffect(() => {
    initialise();
  }, [initialise]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/setup"
          element={
            <RequireAuth>
              <TenantSetup />
            </RequireAuth>
          }
        />
        <Route
          element={
            <RequireAuth>
              <RequireTenant>
                <AppShell />
              </RequireTenant>
            </RequireAuth>
          }
        >
          <Route path="/employees" element={<EmployeeDirectory />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="/organisation" element={<OrgManagement />} />
          <Route path="/org-chart" element={<OrgChart />} />
          <Route path="/team" element={<Team />} />
        </Route>
        <Route
          path="*"
          element={
            loading ? null : (
              <Navigate to={!session ? '/auth' : !tenantId ? '/setup' : '/employees'} replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
