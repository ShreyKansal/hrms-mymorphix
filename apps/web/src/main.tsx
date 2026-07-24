import { createRoot } from 'react-dom/client';
import '@atlaskit/css-reset';
import './styles/tailwind.css';
import App from './App.tsx';

// NOTE: deliberately NOT wrapped in <StrictMode>. Confirmed via a real browser test
// (Playwright) that @atlaskit/modal-dialog has a genuine bug under React 18 StrictMode:
// StrictMode's intentional double-invocation of mount effects causes the modal to
// misinterpret its own opening click as an outside-click and close itself immediately,
// before it's ever visible. This is an Atlaskit/React-18-StrictMode compatibility gap, not
// a bug in this app — see docs/hrms-prd/00-existing-system-audit.md OQ-3 and
// docs/build/verification-evidence/README.md Bug 1. Revisit if a newer Atlaskit release
// fixes it upstream. (No TanStack Query provider needed anymore either — Zustand stores
// call the Supabase client directly.)
createRoot(document.getElementById('root')!).render(<App />);
