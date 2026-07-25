import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '../../lib/ui/cn';

// Supabase Tabs (components/tabs.md): an underline tab strip. The active tab reads in the full
// foreground color with a brand-green underline; inactive tabs are tertiary and warm to
// foreground on hover.
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('flex gap-5 border-b border-default', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '-mb-px border-b-2 border-transparent px-0.5 pb-2.5 text-sm font-medium text-foreground-lighter transition-colors outline-none',
        'hover:text-foreground',
        'data-[state=active]:border-brand data-[state=active]:text-foreground',
        'focus-visible:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-6 outline-none', className)} {...props} />;
}
