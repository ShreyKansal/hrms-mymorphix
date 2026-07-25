import { createRoot } from 'react-dom/client';
import './styles/tailwind.css';
import App from './App.tsx';

// StrictMode was originally left off because of a genuine @atlaskit/modal-dialog bug under
// React 18 (see docs/build/verification-evidence/README.md Bug 1) — that dependency is gone
// now (the Radix+Tailwind migration replaced every Atlaskit component, see
// docs/design-system/), so the original reason no longer applies. Left off for now anyway
// rather than re-enabling it as an unrequested side effect of this cleanup — revisit
// deliberately, with its own verification pass, not bundled into an unrelated change.
createRoot(document.getElementById('root')!).render(<App />);
