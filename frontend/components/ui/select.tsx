'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> { }

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <select
                className={cn(
                    'flex h-12 w-full rounded-[1.5rem] border border-stone-100 dark:border-white/10 bg-white dark:bg-zinc-900 px-5 py-2 text-sm ring-offset-white focus:outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-luxury-black dark:text-white',
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </select>
        );
    }
);
Select.displayName = 'Select';

export { Select };
