import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Classification } from '../../types.ts';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.ts';

export type BadgeVariant = Classification | 'ok' | 'bad' | 'unknown' | 'neutral' | 'info';

export interface BadgeProps {
  status?: BadgeVariant;
  variant?: BadgeVariant;
  label?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  animate?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  label,
  children,
  icon,
  size = 'md',
  className = '',
  animate = false,
}) => {
  const prefersReduced = usePrefersReducedMotion();
  const effectiveStatus = variant || status || 'neutral';
  let defaultLabel = children || label;
  let defaultIcon = icon;
  let styleClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (effectiveStatus === 'likely_deliverable' || effectiveStatus === 'ok') {
    defaultLabel = defaultLabel || 'Likely Deliverable';
    defaultIcon = defaultIcon || <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    styleClasses = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
  } else if (effectiveStatus === 'likely_bounce' || effectiveStatus === 'bad') {
    defaultLabel = defaultLabel || 'Likely to Bounce';
    defaultIcon = defaultIcon || <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />;
    styleClasses = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25';
  } else if (effectiveStatus === 'unknown') {
    defaultLabel = defaultLabel || 'Unknown';
    defaultIcon = defaultIcon || <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />;
    styleClasses = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  const content = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeClasses} ${styleClasses} ${className}`}
    >
      {defaultIcon}
      <span>{defaultLabel}</span>
    </span>
  );

  if (animate && !prefersReduced) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {content}
      </motion.span>
    );
  }

  return content;
};
