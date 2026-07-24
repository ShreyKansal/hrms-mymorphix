import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from 'radix-ui';
import { Search } from 'lucide-react';
import { useEmployeesStore } from '../modules/core-hr/store';
import { cn } from './ui/cn';

// Migrated to Radix's Dialog primitive (Supabase design system's own modality pattern —
// docs/design-system/supabase-source/apps/design-system/content/docs/ui-patterns/modality.mdx
// — a centered overlay with its own backdrop) instead of a hand-rolled fixed-position div.
// Gets real accessibility semantics (focus trap, aria-modal, Escape handling) for free instead
// of reimplementing them; the keyboard *navigation within results* (arrow keys, Enter-to-select)
// is still custom since that's specific to this palette, not something Dialog provides.
const kbdClass = 'rounded border border-border bg-sunken px-1.5 py-0.5 text-xs text-text-subtlest';

export function useCommandPaletteHotkey(onToggle: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// Scoped to Employees today — the one module with a real, populated dataset. A "universal"
// palette that also claims to search Departments/Documents before those have real content
// would be decoration wearing the shape of a feature.
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { employees, fetchEmployees } = useEmployeesStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchEmployees();
    setQuery('');
    setActiveIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const trimmed = query.trim().toLowerCase();
  const results = (
    trimmed
      ? employees.filter((e) => e.legal_name.toLowerCase().includes(trimmed) || e.employee_code.toLowerCase().includes(trimmed))
      : employees
  ).slice(0, 8);

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed]);

  const select = (id: string) => {
    navigate(`/employees/${id}`);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      select(results[activeIndex].id);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[500] bg-[rgba(9,30,66,0.54)]" />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-[500] flex max-h-[60vh] w-[560px] max-w-[90vw] -translate-x-1/2 flex-col overflow-hidden rounded-lg bg-background shadow-[0_8px_24px_rgba(9,30,66,0.25)]"
        >
          <Dialog.Title className="sr-only">Search employees</Dialog.Title>
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
            <Search className="h-[18px] w-[18px] shrink-0 text-text-subtle" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search employees…"
              className="min-w-0 flex-1 border-none bg-transparent text-base text-foreground outline-none"
            />
            <kbd className={kbdClass}>Esc</kbd>
          </div>

          <div className="overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-subtlest">No employees found.</div>
            ) : (
              <>
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-subtlest">
                  {trimmed ? 'Employees' : 'All employees'}
                </div>
                {results.map((e, i) => (
                  <div
                    key={e.id}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      select(e.id);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn('flex cursor-pointer items-baseline justify-between rounded px-2.5 py-2', i === activeIndex ? 'bg-selected-bg' : 'bg-transparent')}
                  >
                    <span className="text-sm font-medium text-foreground">{e.legal_name}</span>
                    <span className="text-xs text-text-subtlest">{e.employee_code}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="flex gap-4 border-t border-border px-4 py-2 text-xs text-text-subtlest">
            <span className="flex items-center gap-1">
              <kbd className={kbdClass}>↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className={kbdClass}>Enter</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className={kbdClass}>Esc</kbd> Close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
