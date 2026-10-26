import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.ts';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, icon, className = '', disabled, ...props }, ref) => {
    const prefersReduced = usePrefersReducedMotion();

    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-xs sm:text-sm px-4 py-2 gap-2',
      lg: 'text-sm sm:text-base px-6 py-3 gap-2.5',
    }[size];

    const variantStyles = {
      primary:
        'bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20 active:bg-cyan-700',
      secondary:
        'bg-slate-100 dark:bg-[var(--bg-overlay)] hover:bg-slate-200 dark:hover:bg-[var(--bg-overlay-hover)] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800',
      outline:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
      danger:
        'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30',
    }[variant];

    return (
      <motion.button
        ref={ref}
        whileTap={disabled || prefersReduced ? undefined : { scale: 0.98 }}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        disabled={disabled}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
