import { Ban, Zap } from 'lucide-react';

import { Badge } from '../../../shared/components/Badge';
import { Card } from '../../../shared/components/Card';

interface EVWarningBannerProps {
  isFullyElectric: boolean;
}

export function EVWarningBanner({ isFullyElectric }: EVWarningBannerProps) {
  if (!isFullyElectric) return null;

  return (
    <Card variant="public" padding="md" className="border-2 border-amber-300 bg-amber-50 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950">
          <Zap className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-extrabold text-amber-950">Vehículo 100% eléctrico</h2>
            <Badge variant="warning" size="sm">Precaución</Badge>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-900">
            Este presupuesto corresponde a un vehículo 100% eléctrico: verifica que los servicios incluidos sean seguros antes de autorizar la aprobación.
          </p>
        </div>
        <Ban className="hidden h-5 w-5 shrink-0 text-amber-700 sm:block" />
      </div>
    </Card>
  );
}