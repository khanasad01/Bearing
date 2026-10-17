'use client';

import React from 'react';

interface ErrorProps {
  /** Title of the error */
  title: string;
  /** Description or details of the error */
  description?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Error component following Bearing design system
 * Shows an error message with appropriate styling
 */
export default function Error({
  title,
  description,
  className = '',
}: ErrorProps) {
  // Base classes
  const baseClasses = 'flex flex-col items-center gap-4 py-8 text-center';

  // Background and border classes
  const bgClass = 'bg-error/10';
  const borderClass = 'border border-error/20';
  const radiusClass = 'rounded-lg';

  // Text classes
  const titleClass = 'text-base font-semibold text-error';
  const descClass = 'text-sm text-muted';

  // Icon color (using error text)
  const iconClass = 'flex-shrink-0 mt-0.5';

  // Combine classes for container
  const containerClasses = `${baseClasses} ${bgClass} ${borderClass} ${radiusClass} ${className}`.trim();

  return (
    <div className={containerClasses} role="alert">
      {/* Error icon (triangle with exclamation) */}
      <div className={iconClass}>
        {/* This is a simple triangle, in a real app we might use an SVG icon */}
        <span className="flex h-3.5 w-3.5 items-center justify-center bg-error text-error/20 rounded-sm">
          !
        </span>
      </div>
      <div className="text-center">
        <h3 className={titleClass}>{title}</h3>
        {description && <p className={descClass}>{description}</p>}
      </div>
    </div>
  );
}