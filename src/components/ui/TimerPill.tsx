'use client';

import React from 'react';

interface TimerPillProps {
  /** Time value in minutes */
  minutes: number;
  /** Label to show before the time (e.g., "Time") */
  label?: string;
  /** Additional class names */
  className?: string;
}

/**
 * TimerPill component following Bearing design system
 * Displays time in a pill shape with actual styling
 */
export default function TimerPill({
  minutes,
  label,
  className = '',
}: TimerPillProps) {
  // Format time as integer minutes
  const timeDisplay = `${Math.round(minutes)} min`;

  // Base classes - using the Chip component's styling for consistency
  const baseClasses = 'inline-flex items-center px-2.5 rounded-full text-xs font-medium';

  // Background and text classes using actual
  const bgClass = 'bg-actual/10';
  const textClass = 'text-actual';

  // Combine classes
  const classes = `${baseClasses} ${bgClass} ${textClass} ${className}`.trim();

  return (
    <span className={classes}>
      {label && <span className="mr-1 text-actual">{label}:</span>}
      {timeDisplay}
    </span>
  );
}