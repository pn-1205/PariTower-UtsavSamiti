'use client';

import React, { useEffect, useRef, useState } from 'react';

interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  className?: string;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className = '',
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState<number>(direction === 'down' ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;
    const duration = 1500; // 1.5s smooth transition

    const startValue = direction === 'down' ? value : 0;
    const endValue = direction === 'down' ? 0 : value;

    const timeoutId = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        // Smooth cubic ease out
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (endValue - startValue) * easeOut;

        setDisplayValue(current);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setDisplayValue(endValue);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, direction, delay]);

  // Format with commas (Indian number format)
  const formatted = displayValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return (
    <span ref={ref} className={`inline-block tabular-nums tracking-tight ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export default NumberTicker;
