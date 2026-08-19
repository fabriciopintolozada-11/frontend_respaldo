import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 4,
  className = '',
}) => {
  return (
    <div className={`w-full animate-pulse space-y-3 ${className}`}>
      <div className="h-7 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-1/3" />
      <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl w-full" />
      ))}
    </div>
  );
};
