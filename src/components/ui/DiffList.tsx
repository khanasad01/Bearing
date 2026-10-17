'use client';

import React from 'react';
import Chip from './Chip';

interface DiffListItem {
  /** Label for the diff item */
  label: string;
  /** Value before change */
  before: string | number;
  /** Value after change */
  after: string | number;
  /** Type of change: increase, decrease, change, neutral */
  changeType?: 'increase' | 'decrease' | 'change' | 'neutral';
}

interface DiffListProps {
  /** Title for the diff list */
  title?: string;
  /** Array of diff items */
  items: DiffListItem[];
  /** Additional class names */
  className?: string;
}

/**
 * DiffList component following Bearing design system
 * Shows differences between two states (e.g., plan vs actual)
 */
export default function DiffList({
  title,
  items,
  className = '',
}: DiffListProps) {
  // Base classes
  const baseClasses = 'space-y-4';

  // Title classes
  const titleClass = 'text-sm font-medium text-actual mb-2';

  // Combine classes
  const classes = `${baseClasses} ${className}`.trim();

  return (
    <div className={classes}>
      {title && <p className={titleClass}>{title}</p>}
      {items.map((item, index) => {
        const { label, before, after, changeType = 'neutral' } = item;

        // Determine change indicator and variant
        let indicator = '•';
        let variant: React.ComponentProps<typeof Chip>['variant'] = 'muted';

        if (changeType === 'increase') {
          indicator = '↑';
          variant = 'success';
        } else if (changeType === 'decrease') {
          indicator = '↓';
          variant = 'error';
        } else if (changeType === 'change') {
          indicator = '↔';
          variant = 'insight';
        }

        return (
          <div key={index} className="flex items-start gap-4 py-2">
            <div className="flex-1">
              <p className="text-sm text-muted">{label}</p>
            </div>
            <div className="flex-1 space-x-2 text-sm font-mono">
              <span className="text-muted">{before}</span>
              <span className="px-1 rounded">→</span>
              <span className="text-muted">{after}</span>
            </div>
            <div className="flex-shrink-0">
              <Chip variant={variant} size="sm">
                {indicator}
              </Chip>
            </div>
          </div>
        );
      })}
    </div>
  );
}