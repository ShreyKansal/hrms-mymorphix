import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from 'radix-ui';
import { Building2, CalendarDays, CornerDownLeft, Network, Search, Shield, UserPlus, Users } from 'lucide-react';
import { useEmployeesStore } from '../modules/core-hr/store';
import { useAuthStore } from '../modules/auth/store';
import { Avatar } from '../components/ui/avatar';
import { cn } from './ui/cn';

// Supabase Command Menu (components/commandmenu.md, ui-patterns/modality.md): a centered overlay
// launched with ⌘/Ctrl+K. It's more than employee search now — it also exposes real navigation
// actions, so it doubles as a fast keyboard router. Results are one flat, arrow-navigable list
// grouped by section; Radix Dialog provides the focus trap / aria-modal / Escape handling, the
// in-list arrow/Enter navigation is custom.
const kbdClass = 'inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-strong bg-surface-200 px-1 text-[11px] font-medium text-foreground-lighter';

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

type Item =
  | { kind: 'nav'; id: string; label: string; hint: string; icon: typeof Users; to: string }
  | { kind: 'employee'; id: string; label: string; hint: string };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
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

  const navActions = useMemo<Item[]>(() => {
    const all: Item[] = [
      { kind: 'nav', id: 'nav-employees', label: 'Employees', hint: 'Directory', icon: Users, to: '/employees' },
      { kind: 'nav', id: 'nav-leave', label: 'Leave', hint: 'Requests & balances', icon: CalendarDays, to: '/leave' },
      { kind: 'nav', id: 'nav-orgchart', label: 'Org Chart', hint: 'Reporting tree', icon: Network, to: '/org-chart' },
    ];
    if (role === 'admin') {
      all.push(
        { kind: 'nav', id: 'nav-add', label: 'Add employee', hint: 'Create record', icon: UserPlus, to: '/employees/new' },
        { kind: 'nav', id: 'nav-org', label: 'Organisation', hint: 'Departments & grades', icon: Building2, to: '/organisation' },
        { kind: 'nav', id: 'nav-team', label: 'Team', hint: 'Roles & invitations', icon: Shield, to: '/team' },
      );
    }
    return all.filter((a) => !trimmed || a.label.toLowerCase().includes(trimmed));
  }, [role, trimmed]);

  const employeeResults = useMemo<Item[]>(() => {
    const list = trimmed
      ? employees.filter((e) => e.legal_name.toLowerCase().includes(trimmed) || e.employee_code.toLowerCase().includes(trimmed))
      : employees;
    return list.slice(0, 6).map((e) => ({ kind: 'employee', id: e.id, label: e.legal_name, hint: e.employee_code }));
  }, [employees, trimmed]);

  const items = useMemo(() => [...navActions, ...employeeResults], [navActions, employeeResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed]);

  const run = (item: Item) => {
    if (item.kind === 'nav') navigate(item.to);
    else navigate(`/employees/${item.id}`);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items[activeIndex]) {
      e.preventDefault();
      run(items[activeIndex]);
    }
  };

  // Flat index bookkeeping so the two groups share one highlight cursor.
  let cursor = -1;
  const renderRow = (item: Item) => {
    cursor += 1;
    const index = cursor;
    const active = index === activeIndex;
    return (
      <button
        key={item.id}
        onMouseDown={(ev) => {
          ev.preventDefault();
          run(item);
        }}
        onMouseEnter={() => setActiveIndex(index)}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors',
          active ? 'bg-surface-200' : 'bg-transparent',
        )}
      >
        {item.kind === 'nav' ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-default bg-surface-100 text-foreground-lighter">
            <item.icon className="h-3.5 w-3.5" />
          </span>
        ) : (
          <Avatar name={item.label} size="xs" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{item.label}</span>
        <span className="shrink-0 font-mono text-xs text-foreground-lighter">{item.hint}</span>
        {active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />}
      </button>
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-[500] flex max-h-[62vh] w-[600px] max-w-[92vw] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-default bg-overlay shadow-2xl"
        >
          <Dialog.Title className="sr-only">Search and navigate</Dialog.Title>
          <div className="flex items-center gap-2.5 border-b border-default px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-foreground-lighter" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search employees or jump to a page…"
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
            />
            <kbd className={kbdClass}>Esc</kbd>
          </div>

          <div className="overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-sm text-foreground">No matches</p>
                <p className="mt-0.5 text-sm text-foreground-lighter">Nothing found for “{query.trim()}”.</p>
              </div>
            ) : (
              <>
                {navActions.length > 0 && (
                  <div className="mb-1">
                    <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">Navigation</p>
                    {navActions.map(renderRow)}
                  </div>
                )}
                {employeeResults.length > 0 && (
                  <div>
                    <p className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                      {trimmed ? 'Employees' : 'Recent employees'}
                    </p>
                    {employeeResults.map(renderRow)}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-default px-4 py-2 text-xs text-foreground-lighter">
            <span className="flex items-center gap-1.5">
              <kbd className={kbdClass}>↑</kbd>
              <kbd className={kbdClass}>↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className={kbdClass}>↵</kbd>
              Open
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className={kbdClass}>Esc</kbd>
              Close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
