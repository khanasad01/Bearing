'use client';

import React from 'react';

interface SkeletonProps {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Radius of the skeleton */
  radius?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Skeleton component following Bearing design system
 * Shows a placeholder shimmer effect while content is loading
 */
export default function Skeleton({
  width = '100%',
  height = '1rem',
  radius = 'md',
  className = '',
}: SkeletonProps) {
  // Radius classes
  const radiusClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
    none: 'rounded-none',
  }[radius] || 'rounded-md';

  // Base classes
  const baseClasses = 'block';

  // Background and animation classes
  // Using surface color and a subtle animation
  const bgClass = 'bg-surface-sunken';
  // We'll use animate-pulse for a simple pulsating effect
  // For a better shimmer, we would need to add custom CSS, but we'll use pulse for now
  const animateClass = 'animate-pulse';

  // Combine classes
  const classes = `${baseClasses} ${bgClass} ${animateClass} ${radiusClasses} ${className}`.trim();

  return (
    <div
      className={classes}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}