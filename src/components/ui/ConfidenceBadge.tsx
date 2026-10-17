'use client';

import React from 'react';

interface ConfidenceBadgeProps {
  /** Confidence value between 0 and 1 */
  confidence: number;
  /** Whether to show the percentage symbol */
  showPercentage?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * ConfidenceBadge component following Bearing design system
 * Displays confidence as a percentage with insight styling
 */
export default function ConfidenceBadge({
  confidence,
  showPercentage = true,
  className = '',
}: ConfidenceBadgeProps) {
  // Format confidence as percentage (0-100%) with one decimal place
  const percentage = Math.round(confidence * 100);
  const displayValue = showPercentage ? `${percentage}%` : `${percentage}`;

  // Base classes
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';

  // Background and text classes using insight
  const bgClass = 'bg-insight/10';
  const textClass = 'text-insight';

  // Combine classes
  const classes = `${baseClasses} ${bgClass} ${textClass} ${className}`.trim();

  return (
    <span className={classes}>
      {displayValue}
    </span>
  );
}