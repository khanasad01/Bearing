'use client';

import React from 'react';

interface AIMarkerProps {
  /** Additional class names */
  className?: string;
  /** Whether to show the full label "AI-inferred" or just "AI" */
  fullLabel?: boolean;
}

/**
 * AIMarker component following Bearing design system
 * Indicates AI-inferred content with insight styling
 */
export default function AIMarker({
  className = '',
  fullLabel = false,
}: AIMarkerProps) {
  // Base classes - using the Chip component's styling for consistency
  const baseClasses = 'inline-flex items-center px-2.5 rounded-full text-xs font-medium';

  // Background and text classes using insight
  const bgClass = 'bg-insight/10';
  const textClass = 'text-insight';

  // Combine classes
  const classes = `${baseClasses} ${bgClass} ${textClass} ${className}`.trim();

  return (
    <span className={classes}>
      {fullLabel ? 'AI-inferred' : 'AI'}
    </span>
  );
}