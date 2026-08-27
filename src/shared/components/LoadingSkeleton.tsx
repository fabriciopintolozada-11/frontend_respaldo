export function LoadingSkeleton({ rows = 4, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`w-full animate-pulse space-y-3 ${className}`}>
      <div className="h-7 bg-slate-200 rounded-xl w-1/3" />
      <div className="h-10 bg-slate-200 rounded-xl w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-100 rounded-xl w-full" />
      ))}
    </div>
  );
}
