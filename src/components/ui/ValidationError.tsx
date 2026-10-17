'use client';

import React from 'react';

interface ValidationErrorProps {
  /** Error message to display */
  message: string;
  /** Additional class names */
  className?: string;
}

/**
 * ValidationError component following Bearing design system
 * Displays error messages with appropriate styling
 */
export default function ValidationError({
  message,
  className = '',
}: ValidationErrorProps) {
  // Base classes
  const baseClasses = 'flex items-start gap-3';

  // Background and border classes
  const bgClass = 'bg-error/10';
  const borderClass = 'border border-error/20';

  // Text color
  const textClass = 'text-error';

  // Icon color (using error text)
  const iconClass = 'flex-shrink-0 mt-0.5';

  // Combine classes
  const containerClasses = `${baseClasses} ${bgClass} ${borderClass} ${className}`.trim();

  return (
    <div className={containerClasses} role="alert">
      {/* Error icon (triangle with exclamation) */}
      <div className={iconClass}>
        {/* This is a simple triangle, in a real app we might use an SVG icon */}
        <span className="flex h-3.5 w-3.5 items-center justify-center bg-error text-error/20 rounded-sm">
          !
        </span>
      </div>
      <div>
        <p className={textClass}>{message}</p>
      </div>
    </div>
  );
}