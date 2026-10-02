import React from 'react';

interface SpinnerProps {
  className?: string;
}

export const Spinner = ({ className = 'text-cyan-400' }: SpinnerProps) => (
  <div className={`animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent ${className}`} />
);

