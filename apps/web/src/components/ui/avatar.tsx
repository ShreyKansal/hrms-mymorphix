import { avatarTint, initials } from '../../lib/avatar';
import { cn } from '../../lib/ui/cn';

// A person avatar in the Supabase idiom (components/avatar.md — a neutral, bordered fallback
// circle, NOT a solid saturated block). Here it's a soft, low-opacity tint of the person's
// colour with a hairline border and dark initials: subtle and easy on the eye, but still
// distinguishable per person. Used across the directory, detail header, org chart, command
// palette, team, and the shell account row.
const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-16 w-16 text-lg',
} as const;

export function Avatar({
  name,
  size = 'sm',
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-full border border-default font-medium text-foreground', SIZES[size], className)}
      style={{ backgroundColor: avatarTint(name) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
