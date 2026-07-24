import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/ui/cn';

// Same variant/size shape as Supabase's design system (see docs/design-system/supabase-source)
// so the rest of the migration can follow one consistent component API — but every color here
// is Atlaskit's real, measured value (see src/styles/tailwind.css's header comment), not
// Supabase's brand palette. Written fresh rather than copying their file, since the actual
// class values are almost entirely different anyway once re-themed.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focused)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        default: 'border border-border bg-background text-foreground hover:bg-secondary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-border bg-transparent hover:bg-secondary',
        ghost: 'hover:bg-secondary',
        link: 'text-selected underline-offset-4 hover:underline',
      },
      size: {
        tiny: 'h-6 px-2 text-xs',
        small: 'h-7 px-2.5 text-xs',
        medium: 'h-8 px-3',
        large: 'h-10 px-4',
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
