'use client';

import React from 'react';

interface StatProps {
  /** Label for the stat */
  label: string;
  /** Value of the stat */
  value: string | number;
  /** Whether the stat is the primary focus (larger text) */
  isPrimary?: boolean;
  /** Subtext to display below the value (e.g., remaining time) */
  subtext?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Stat component following Bearing design system
 * Consumes semantic tokens from CSS variables
 */
export default function Stat({
  label,
  value,
  isPrimary = false,
  subtext,
  className = '',
}: StatProps) {
  // Base classes
  const baseClasses = 'flex flex-col items-center gap-1';

  // Text classes
  const labelClass = 'text-sm font-medium text-muted';
  const valueClass = isPrimary
    ? 'font-mono text-2xl font-bold text-actual'
    : 'font-mono text-lg font-medium text-actual';
  const subtextClass = 'text-xs text-muted mt-1';

  // Combine classes
  const classes = `${baseClasses} ${className}`.trim();

  return (
    <div className={classes}>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value}</p>
      {subtext && <p className={subtextClass}>{subtext}</p>}
    </div>
  );
}