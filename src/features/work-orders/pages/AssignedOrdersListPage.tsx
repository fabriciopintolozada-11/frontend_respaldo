import { useState } from 'react'
import { Wrench, RefreshCw, Lock } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { AssignedOrderCard } from '@/features/work-orders/components/AssignedOrderCard'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { useAssignedOrders } from '@/features/work-orders/hooks/use-assigned-orders'

interface AssignedOrdersListPageProps {
  onSelectOrder: (id: string) => void
}

export function AssignedOrdersListPage({ onSelectOrder }: AssignedOrdersListPageProps) {
  const [page] = useState(1)
  const pageSize = 20
  const { data, isLoading, error, refetch, isFetching } = useAssignedOrders(page, pageSize)

  if (isLoading) {
    return <LoadingSpinner message="Cargando ordenes asignadas..." />
  }

  if (error) {
    return <ErrorState message="No se pudieron cargar las ordenes asignadas." onRetry={refetch} />
  }

  const orders = data?.data ?? []

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Ordenes Asignadas
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Panel de trabajo operativo personal del mecanico (HU-03, RN-04).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* RN-16 Privacy Notice */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs font-semibold text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>RN-16: Vista tecnica sin costos</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refrescar
          </Button>
        </div>
      </div>

      {/* Orders Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          Tus Ordenes ({orders.length})
        </h2>
        {data && data.total > pageSize && (
          <span className="text-[10px] text-muted-foreground font-mono">
            Pagina {data.page} de {Math.ceil(data.total / data.pageSize)} ({data.total} total)
          </span>
        )}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-8 h-8 text-muted-foreground" />}
          title="Sin ordenes asignadas actualmente"
          description="No tienes ordenes de trabajo en cola. El Jefe de Taller te asignara la proxima orden disponible."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <AssignedOrderCard key={order.id} order={order} onSelect={onSelectOrder} />
          ))}
        </div>
      )}
    </div>
  )
}
