'use client';

import React from 'react';

interface InputProps {
  /** Input identifier for an associated label */
  id?: string;
  /** Input type (text, number, email, etc.) */
  type?: string;
  /** Label for the input */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string | number;
  /** Change handler */
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  /** Minimum value for numeric inputs */
  min?: string | number;
  /** Whether the field is required */
  required?: boolean;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether input has error */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Additional class names */
  className?: string;
  /** Input element (for textarea) */
  as?: 'input' | 'textarea';
  /** Rows for textarea */
  rows?: number;
}

/**
 * Input component following Bearing design system
 * Consumes semantic tokens from CSS variables
 */
export default function Input({
  id,
  type = 'text',
  label,
  placeholder = '',
  value,
  onChange,
  min,
  required = false,
  disabled = false,
  error = false,
  errorMessage,
  className = '',
  as = 'input',
  rows,
}: InputProps) {
  // Base classes
  const baseClasses = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed block w-full';

  // Border classes based on state
  const borderClasses = error
    ? 'border-border-strong' // error state uses border-strong
    : 'border-border'; // default border

  // Background classes
  const bgClass = 'bg-surface-sunken';

  // Text color
  const textClass = 'text-ink';

  // Combine classes
  const inputClasses = `${baseClasses} ${borderClasses} ${bgClass} ${textClass} ${className}`.trim();

  // Label classes
  const labelClasses = 'mb-1 block text-sm font-medium text-muted';

  // Error message classes
  const errorMessageClasses = 'mt-1 text-xs text-error';

  return (
    <div className="space-y-1">
      {label && (
        <label className={labelClasses}>
          {label}
        </label>
      )}
      {as === 'textarea' ? (
        <textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          rows={rows ?? 3}
          className={inputClasses}
        />
      ) : (
        <input
          id={id}
          type={type}
          min={min}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={inputClasses}
        />
      )}
      {error && errorMessage && (
        <p className={errorMessageClasses}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}