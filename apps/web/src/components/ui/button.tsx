import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/ui/cn';

// Supabase design system Button — matched to the design system's actual rendered markup. Notes:
// - `primary` is the brand-green action: `bg-brand-400` in light / `bg-brand-500` in dark, with
//   `text-foreground` (so the label is dark-on-green in light, light-on-green in dark) and a
//   brand-tinted border. This is exactly what Supabase's own "Sign in" button uses.
// - Buttons are `font-normal` (Supabase's `font-regular`) with a neutral focus ring — the brand
//   green is reserved for the fill, not the focus state.
// - Size heights mirror Supabase's scale; `medium` (h-[34px]) lines up with Input in toolbars.
const buttonVariants = cva(
  'focus-ring relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border text-center font-normal transition-colors duration-200 ease-out disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-brand-500/75 bg-brand-400 text-foreground hover:border-brand-600 hover:bg-brand/80 dark:border-brand/30 dark:bg-brand-500 dark:hover:border-brand dark:hover:bg-brand/50',
        default: 'border-strong bg-alternative text-foreground hover:border-stronger hover:bg-selection dark:bg-muted',
        secondary: 'border-strong bg-surface-300 text-foreground hover:bg-surface-300/70',
        outline: 'border-strong bg-transparent text-foreground hover:border-stronger hover:bg-selection',
        warning: 'border-warning bg-warning text-warning-foreground hover:bg-warning/90',
        destructive: 'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'border-transparent bg-transparent text-foreground-light hover:bg-surface-200 hover:text-foreground',
        link: 'border-transparent bg-transparent text-brand-link underline-offset-4 hover:underline',
      },
      size: {
        tiny: 'h-[26px] gap-1.5 px-2.5 text-xs',
        small: 'h-[30px] px-3 text-xs',
        medium: 'h-[34px] px-3 text-sm',
        large: 'h-[42px] px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'medium',
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
