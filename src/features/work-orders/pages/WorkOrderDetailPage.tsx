import {
  ArrowLeft,
  Wrench,
  Package,
  CheckCircle2,
  Clock,
  Lock,
  FileText,
} from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { WorkOrderStatusBadge } from '@/features/work-orders/components/WorkOrderStatusBadge'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { ErrorState } from '@/shared/components/ErrorState'
import { useAssignedOrderDetail } from '@/features/work-orders/hooks/use-assigned-orders'

interface WorkOrderDetailPageProps {
  orderId: string
  onBack: () => void
}

export function WorkOrderDetailPage({ orderId, onBack }: WorkOrderDetailPageProps) {
  const { data: order, isLoading, error, refetch } = useAssignedOrderDetail(orderId)

  if (isLoading) {
    return <LoadingSpinner message="Cargando detalle de la orden..." />
  }

  if (error || !order) {
    return <ErrorState message="No se pudo cargar el detalle de la orden asignada." onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver
          </Button>
          <span className="font-mono text-xs font-bold text-muted-foreground">ID: {order.id}</span>
        </div>

        {/* RN-16 Privacy Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs font-semibold text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>RN-16: Vista tecnica sin costos</span>
        </div>
      </div>

      {/* Main Header Card */}
      <Card padding="lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary bg-primary/15 border border-primary/30 px-3 py-1 rounded-xl">
                {order.id.slice(0, 8).toUpperCase()}
              </span>
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {order.plate}
              </h1>
              {order.vehicle && (
                <span className="text-sm font-semibold text-muted-foreground">
                  {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})
                </span>
              )}
              <WorkOrderStatusBadge status={order.status} size="lg" />
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {order.vehicle && (
                <>
                </>
              )}
              <span>Asignado: <strong className="text-foreground">{order.assignedAt ? new Date(order.assignedAt).toLocaleDateString('es-BO') : 'Sin fecha'}</strong></span>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Diagnosis + Tasks + Parts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Diagnosis & Complaint */}
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Diagnostico y Motivo de Ingreso
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Sintomas Reportados:
                </span>
                <p className="text-foreground">{order.initialComplaint}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Informe Tecnico:
                </span>
                <p className="text-foreground">
                  {order.diagnosticReport || 'Diagnostico pendiente de registro en bahia.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Status History */}
          {order.statusHistory.length > 0 && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Historial de Estados
                </h2>
              </div>

              <div className="space-y-3">
                {order.statusHistory.map((hist, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{hist.status}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {new Date(hist.timestamp).toLocaleString('es-BO')}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">Por: {hist.changedBy}</p>
                      {hist.reason && <p className="text-muted-foreground italic mt-0.5">&quot;{hist.reason}&quot;</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Tasks & Parts (RN-16: NO prices) */}
        <div className="space-y-4">
          {/* Labor Tasks */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Operaciones de Mano de Obra
                </h2>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted border border-border text-[10px] font-semibold text-muted-foreground">
                <Lock className="w-3 h-3 text-primary" />
                Sin costos (RN-16)
              </div>
            </div>

            {order.tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No hay tareas de mano de obra registradas aun.</p>
            ) : (
              <div className="space-y-2">
                {order.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      task.isCompleted
                        ? 'bg-success/10 border-success/30'
                        : 'bg-muted border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${task.isCompleted ? 'line-through opacity-70 text-foreground' : 'text-foreground'}`}>
                        {task.description}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-background text-muted-foreground border border-border">
                      {task.estimatedHours}h est.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Parts (RN-16: NO prices) */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Repuestos Requeridos
                </h2>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted border border-border text-[10px] font-semibold text-muted-foreground">
                <Lock className="w-3 h-3 text-primary" />
                Sin costos (RN-16)
              </div>
            </div>

            {order.parts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No se requirieron repuestos para esta orden.</p>
            ) : (
              <div className="space-y-2">
                {order.parts.map((part) => (
                  <div
                    key={part.id}
                    className="p-3 rounded-xl border border-border bg-muted flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-primary">
                          {part.partCode}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          x{part.quantityRequired} un.
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {part.description}
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      part.status === 'INSTALADO'
                        ? 'bg-success/15 border-success/30 text-success'
                        : 'bg-background border-border text-muted-foreground'
                    }`}>
                      {part.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
