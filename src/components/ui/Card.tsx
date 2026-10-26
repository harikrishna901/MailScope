import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.ts';

interface CardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  children,
  className = '',
  onClick,
  onKeyDown,
  ...props
}) => {
  const prefersReduced = usePrefersReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
    onKeyDown?.(e);
  };

  return (
    <motion.div
      whileHover={interactive && !prefersReduced ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`p-5 sm:p-6 rounded-2xl ${
        interactive ? 'surface-interactive' : 'surface'
      } ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </motion.div>
  );
};
