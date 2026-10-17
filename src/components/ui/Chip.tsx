'use client';

import React from 'react';

interface ChipProps {
  /** Chip text */
  children: React.ReactNode;
  /** Chip variant */
  variant?: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error' | 'insight';
  /** Chip size */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

/**
 * Chip component following Bearing design system
 * Consumes semantic tokens from CSS variables
 */
export default function Chip({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
}: ChipProps) {
  // Base classes
  const baseClasses = 'inline-flex items-center px-2.5 rounded-full text-xs font-medium transition-colors';

  // Variant classes - consume semantic tokens
  const variantClasses = {
    primary: `bg-actual/10 text-actual hover:bg-actual/20`,
    secondary: `bg-muted/10 text-muted hover:bg-muted/20`,
    muted: `bg-muted/10 text-muted hover:bg-muted/20`,
    success: `bg-success/10 text-success hover:bg-success/20`,
    warning: `bg-warning/10 text-warning hover:bg-warning/20`,
    error: `bg-error/10 text-error hover:bg-error/20`,
    insight: `bg-insight/10 text-insight hover:bg-insight/20`,
  }[variant];

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-2.5 py-1',
  }[size];

  // Combine classes
  const classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();

  return (
    <span className={classes}>
      {children}
    </span>
  );
}