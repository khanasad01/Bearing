'use client';

import React from 'react';

interface CardProps {
  /** Children content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether the card has a border */
  bordered?: boolean;
  /** Whether the card is sunken (inset) */
  sunken?: boolean;
}

/**
 * Card component following Bearing design system
 * Consumes semantic tokens from CSS variables
 */
export default function Card({
  children,
  className = '',
  bordered = false,
  sunken = false,
}: CardProps) {
  // Base classes
  const baseClasses = 'flex flex-col items-start gap-4';

  // Border classes
  const borderClasses = bordered
    ? 'border border-border-strong'
    : 'border-none';

  // Background classes
  const bgClass = sunken
    ? 'bg-surface-sunken'
    : 'bg-surface';

  // Padding classes
  const pClass = 'p-6';

  // Radius classes
  const radiusClass = 'rounded-lg';

  // Shadow classes (restrained)
  const shadowClass = 'shadow-1';

  // Combine classes
  const classes = `${baseClasses} ${borderClasses} ${bgClass} ${pClass} ${radiusClass} ${shadowClass} ${className}`.trim();

  return (
    <div className={classes}>
      {children}
    </div>
  );
}