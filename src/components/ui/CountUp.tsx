import React, { useEffect, useState } from 'react';
import { animate } from 'motion/react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.ts';

interface CountUpProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 0.8,
  formatter = (v) => Math.round(v).toLocaleString(),
  className = '',
  suffix = '',
  prefix = '',
}) => {
  const prefersReduced = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(() => (prefersReduced ? value : 0));

  useEffect(() => {
    if (prefersReduced) {
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [value, duration, prefersReduced]);

  const formattedFinal = `${prefix}${formatter(value)}${suffix}`;
  const formattedDisplay = `${prefix}${formatter(displayValue)}${suffix}`;

  return (
    <span className={className}>
      {/* Screen reader gets the final value once without tick spam */}
      <span className="sr-only">{formattedFinal}</span>
      {/* Visual animated display */}
      <span aria-hidden="true">{prefersReduced ? formattedFinal : formattedDisplay}</span>
    </span>
  );
};

export default CountUp;
