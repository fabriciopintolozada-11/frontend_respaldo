export function LoadingSkeleton({ rows = 4, tone = 'dark', className = '' }: { rows?: number; tone?: 'dark' | 'light'; className?: string }) {
  const bar = tone === 'light' ? 'bg-slate-200' : 'bg-[#2D3139]';

  return (
    <div className={`w-full animate-pulse space-y-3 ${className}`}>
      <div className={`h-7 ${bar} rounded-xl w-1/3`} />
      <div className={`h-10 ${bar} rounded-xl w-full`} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`h-16 ${bar}/60 rounded-xl w-full`} />
      ))}
    </div>
  );
}