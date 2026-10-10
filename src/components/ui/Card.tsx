'use client';

import React, { forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: 'default' | 'glass' | 'interactive';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, variant = 'default', onMouseMove, children, ...props }, ref) => {
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (variant === 'interactive') {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
          e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
        }
        onMouseMove?.(e);
      },
      [variant, onMouseMove]
    );

    const variantStyles = {
      default:
        'paper-sheet bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm',
      glass: 'paper-sheet bg-white/90 dark:bg-stone-900/90 rounded-2xl shadow-sm border border-stone-200/80 dark:border-stone-800',
      interactive: 'paper-sheet rounded-2xl cursor-pointer bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800',
    };

    return (
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        className={cn(
          'rounded-2xl transition-all duration-200',
          variantStyles[variant],
          hoverable &&
            variant === 'default' &&
            'hover:shadow-md hover:border-stone-400 dark:hover:border-stone-600 hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
