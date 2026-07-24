import { create } from 'zustand';

interface PageTitleState {
  title: string | null;
  setTitle: (title: string | null) => void;
}

// Lets a detail page (e.g. Employee Detail) supply the actual record name for the last
// breadcrumb segment on a dynamic route (/employees/:id), without AppShell needing its own
// duplicate fetch just to resolve a name it doesn't otherwise need. Call setTitle(name) once
// loaded, setTitle(null) on unmount — see EmployeeDetail.tsx for the pattern.
export const usePageTitleStore = create<PageTitleState>((set) => ({
  title: null,
  setTitle: (title) => set({ title }),
}));
