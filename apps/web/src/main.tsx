import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@atlaskit/css-reset';
import App from './App.tsx';

const queryClient = new QueryClient();

// NOTE: deliberately NOT wrapped in <StrictMode>. Confirmed via a real browser test
// (Playwright, see debug session in this commit's history) that @atlaskit/modal-dialog
// v13.4.0 has a genuine bug under React 18 StrictMode: StrictMode's intentional
// double-invocation of mount effects causes the modal to misinterpret its own opening
// click as an outside-click and close itself immediately, before it's ever visible.
// This is a real Atlaskit/React-18-StrictMode compatibility gap, not a bug in this app —
// see docs/hrms-prd/00-existing-system-audit.md OQ-3 (component status sweep) and revisit
// if a newer @atlaskit/modal-dialog release fixes it upstream.
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
