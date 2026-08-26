import { Ban, ShieldAlert, Zap } from 'lucide-react';

import { Badge } from '../../../shared/components/Badge';
import { Card } from '../../../shared/components/Card';

interface EVWarningBannerProps {
  isFullyElectric: boolean;
  blockedItemCount: number;
}

export function EVWarningBanner({ isFullyElectric, blockedItemCount }: EVWarningBannerProps) {
  if (!isFullyElectric) return null;

  return (
    <Card variant="public" padding="md" className="border-2 border-amber-300 bg-amber-50 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950">
          <Zap className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-extrabold text-amber-950">RN-18: Vehículo 100% eléctrico</h2>
            <Badge variant="warning" size="sm">Acciones restringidas</Badge>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-900">
            El presupuesto solo puede incluir procedimientos autorizados para sistemas eléctricos. Los servicios de motor de combustión están bloqueados para evitar una aprobación incorrecta.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-950">
            <ShieldAlert className="h-4 w-4" />
            {blockedItemCount} {blockedItemCount === 1 ? 'ítem bloqueado' : 'ítems bloqueados'}
          </div>
        </div>
        <Ban className="hidden h-5 w-5 shrink-0 text-amber-700 sm:block" />
      </div>
    </Card>
  );
}
