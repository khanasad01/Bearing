'use client';

import React from 'react';

interface FallbackProps {
  /** Title to display */
  title: string;
  /** Description or message to display */
  description?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Fallback component following Bearing design system
 * Shows a generic fallback message when something goes wrong
 */
export default function Fallback({
  title,
  description,
  className = '',
}: FallbackProps) {
  // Base classes
  const baseClasses = 'flex flex-col items-center gap-4 py-8 text-center';

  // Text classes
  const titleClass = 'text-base font-semibold text-muted';
  const descClass = 'text-sm text-muted';

  // Combine classes
  const classes = `${baseClasses} ${className}`.trim();

  return (
    <div className={classes}>
      <h3 className={titleClass}>{title}</h3>
      {description && <p className={descClass}>{description}</p>}
    </div>
  );
}