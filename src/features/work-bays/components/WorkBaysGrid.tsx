import type { WorkBayMonitoring } from '../api/types';
import { WorkBayCard } from './WorkBayCard';

export interface WorkBaysGridProps {
  bays: WorkBayMonitoring[];
}

export function WorkBaysGrid({ bays }: WorkBaysGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {bays.map((bay) => (
        <WorkBayCard key={bay.bayId} bay={bay} />
      ))}
    </div>
  );
}