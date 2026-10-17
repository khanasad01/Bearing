'use client';

import React from 'react';
import Button from './Button';

interface RetryProps {
  /** Click handler for the retry action */
  onClick: () => void;
  /** Label for the retry button */
  label?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional props to pass to the Button component */
  buttonProps?: Omit<React.ComponentPropsWithRef<typeof Button>, 'onClick' | 'children'>;
}

/**
 * Retry component following Bearing design system
 * Shows a button to retry an action
 */
export default function Retry({
  onClick,
  label = 'Retry',
  disabled = false,
  buttonProps = {},
}: RetryProps) {
  return (
    <Button
      variant="primary"
      onClick={onClick}
      disabled={disabled}
      {...buttonProps}
    >
      {label}
    </Button>
  );
}