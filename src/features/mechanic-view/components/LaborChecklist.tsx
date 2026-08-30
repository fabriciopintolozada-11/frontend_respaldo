import { CheckCircle2, Square } from 'lucide-react';

interface LaborChecklistProps {
  tasks: { id: string; description: string; estimatedHours: number; isCompleted: boolean }[];
  onToggle: (taskId: string) => void;
  isPending: boolean;
}

export function LaborChecklist({
  tasks,
  onToggle,
  isPending,
}: LaborChecklistProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-lime-700" />
          Labor Operations
        </h3>
        <span className="text-[11px] text-slate-600">Tap to complete</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-slate-600 italic">
          No labor tasks registered yet.
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => !isPending && onToggle(task.id)}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all min-h-[52px] ${
                task.isCompleted
                  ? 'bg-lime-50 border-lime-200 text-lime-800'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {task.isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-lime-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <span
                  className={`text-sm font-medium ${
                    task.isCompleted ? 'line-through opacity-70' : 'text-slate-950'
                  }`}
                >
                  {task.description}
                </span>
              </div>

              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white text-slate-600 border border-slate-200 shrink-0">
                {task.estimatedHours}h est.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
