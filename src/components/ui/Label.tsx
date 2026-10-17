import type { ReactNode } from 'react';

interface LabelProps {
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

export default function Label({ htmlFor, children, className = '' }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block font-sans text-sm font-medium text-muted ${className}`.trim()}>
      {children}
    </label>
  );
}
