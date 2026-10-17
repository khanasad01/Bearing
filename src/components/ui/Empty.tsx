'use client';

import React from 'react';

interface EmptyProps {
  /** Title to display */
  title: string;
  /** Description or message to display */
  description?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Empty component following Bearing design system
 * Shows a message when there is no data to display
 */
export default function Empty({
  title,
  description,
  className = '',
}: EmptyProps) {
  // Base classes
  const baseClasses = 'flex flex-col items-center gap-4 py-8 text-center';

  // Text classes
  const titleClass = 'text-base font-semibold text-actual';
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