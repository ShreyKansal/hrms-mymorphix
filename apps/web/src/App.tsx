import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentTenantId } from './api/client';
import TenantSetup from './pages/TenantSetup';
import EmployeeDirectory from './pages/EmployeeDirectory';
import EmployeeDetail from './pages/EmployeeDetail';

function RequireTenant({ children }: { children: ReactNode }) {
  if (!getCurrentTenantId()) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<TenantSetup />} />
        <Route
          path="/employees"
          element={
            <RequireTenant>
              <EmployeeDirectory />
            </RequireTenant>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <RequireTenant>
              <EmployeeDetail />
            </RequireTenant>
          }
        />
        <Route path="*" element={<Navigate to={getCurrentTenantId() ? '/employees' : '/setup'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
