import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { token } from '@atlaskit/tokens';
import { useEmployeesStore } from '../modules/core-hr/store';

// First rebuild wasn't the right pattern at all — a dropdown pinned under a small sidebar
// input isn't what "search bar" means in every reference product actually shown (ClickUp,
// Attio, Linear): that's a *trigger* for a centered, modal command palette with its own
// backdrop, not a live-filtering text box in place. Researched before rebuilding this time
// (uxpatterns.dev's command-palette pattern, Linear/Vercel-style Cmd+K writeups): backdrop +
// centered floating panel, full keyboard operability (arrow keys + Enter, not just typing),
// grouped results with a label, and a visible idle/empty state — not just the happy path.
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" role="presentation" style={{ flexShrink: 0 }}>
      <g fill="currentcolor" fillRule="evenodd">
        <path
          fillRule="evenodd"
          d="M10.5 3a7.5 7.5 0 1 0 4.55 13.46l4.245 4.244a1 1 0 0 0 1.414-1.414l-4.243-4.244A7.5 7.5 0 0 0 10.5 3M5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0"
        />
      </g>
    </svg>
  );
}

const kbdStyle = {
  fontSize: 11,
  color: token('color.text.subtlest', '#8590A2'),
  border: `1px solid ${token('color.border', '#DCDFE4')}`,
  borderRadius: 3,
  padding: '1px 5px',
  fontFamily: 'inherit',
  backgroundColor: token('elevation.surface.sunken', '#F7F8F9'),
};

// Cmd/Ctrl+K toggles from anywhere in the app, independent of whether the trigger button in
// the sidebar is even visible/scrolled into view — matches the shortcut every reference
// product trains users to reach for without looking at the sidebar first.
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
// would be decoration wearing the shape of a feature. Structured as its own component so
// extending the scope later (more entity types, recent-items tracking) is additive, not a
// rewrite.
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
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const trimmed = query.trim().toLowerCase();
  // Empty query shows the first several employees rather than nothing — a blank palette with
  // no idea what's searchable is a worse first impression than a short "browse" list, and this
  // app has no real "recently viewed" tracking to show instead (labeled "All employees", not
  // "Recent", so it isn't claiming to be something it's not).
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

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
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
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, activeIndex]);

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 30, 66, 0.54)',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '12vh',
        zIndex: 500,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        style={{
          width: 560,
          maxWidth: '90vw',
          maxHeight: '60vh',
          backgroundColor: token('elevation.surface.overlay', '#FFFFFF'),
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(9,30,66,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: 'fit-content',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${token('color.border', '#DCDFE4')}` }}>
          <span style={{ color: token('color.icon.subtle', '#626F86'), display: 'flex' }}>
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees…"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', color: token('color.text', '#172B4D') }}
          />
          <kbd style={kbdStyle}>Esc</kbd>
        </div>

        <div style={{ overflowY: 'auto', padding: 8 }}>
          {results.length === 0 ? (
            <div style={{ padding: '32px 12px', textAlign: 'center', color: token('color.text.subtlest', '#8590A2'), fontSize: 13 }}>
              No employees found.
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '6px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  color: token('color.text.subtlest', '#8590A2'),
                }}
              >
                {trimmed ? 'Employees' : 'All employees'}
              </div>
              {results.map((e, i) => (
                <ResultRow
                  key={e.id}
                  active={i === activeIndex}
                  name={e.legal_name}
                  code={e.employee_code}
                  onSelect={() => select(e.id)}
                  onHover={() => setActiveIndex(i)}
                />
              ))}
            </>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: '8px 16px',
            borderTop: `1px solid ${token('color.border', '#DCDFE4')}`,
            fontSize: 12,
            color: token('color.text.subtlest', '#8590A2'),
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={kbdStyle}>↑↓</kbd> Navigate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={kbdStyle}>Enter</kbd> Select
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={kbdStyle}>Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  active,
  name,
  code,
  onSelect,
  onHover,
}: {
  active: boolean;
  name: string;
  code: string;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      onMouseEnter={onHover}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '8px 10px',
        borderRadius: 4,
        cursor: 'pointer',
        backgroundColor: active ? token('color.background.selected', '#E9F2FF') : 'transparent',
      }}
    >
      <span style={{ color: token('color.text', '#172B4D'), fontWeight: 500, fontSize: 14 }}>{name}</span>
      <span style={{ color: token('color.text.subtlest', '#8590A2'), fontSize: 12 }}>{code}</span>
    </div>
  );
}
