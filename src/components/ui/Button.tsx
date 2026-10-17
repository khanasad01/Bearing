'use client';

import React from 'react';

interface ButtonProps {
  /** Button variant */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive' | 'link';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button is disabled */
  disabled?: boolean;
  /** Button type (submit, button, reset) */
  type?: 'submit' | 'button' | 'reset';
  /** Click handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Children content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Button component following Bearing design system
 * Consumes semantic tokens from CSS variables
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
}: ButtonProps) {
  // Base classes
  const baseClasses = 'flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Size classes
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-11 px-5 text-lg',
  }[size];

  // Variant classes - consume semantic tokens
  const variantClasses = {
    // Primary: solid actual (ink) background, paper text
    primary: `bg-actual text-background hover:bg-plan focus-visible:ring-actual/20`,

    // Accent: insight background, ink text
    accent: `bg-insight text-ink hover:bg-insight/90 focus-visible:ring-insight/20`,

    // Secondary: surface background, actual text, border
    secondary: `bg-surface text-actual border border-actual hover:bg-actual/5 focus-visible:ring-actual/20`,

    // Ghost: transparent background, actual text, hover on plan-soft
    ghost: `hover:bg-plan-soft text-actual focus-visible:ring-actual/20`,

    // Destructive: destructive background, ink text
    destructive: `bg-danger text-ink hover:bg-danger/90 focus-visible:ring-danger/20`,
    link: `text-actual hover:text-underline px-0 py-0`,
  }[variant];

  // Combine all classes
  const classes = `${baseClasses} ${sizeClasses} ${variantClasses} ${className}`.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}