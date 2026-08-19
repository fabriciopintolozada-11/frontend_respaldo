import { useState } from 'react'
import { Wrench, Lock } from 'lucide-react'
import { AssignedOrdersListPage } from '@/features/work-orders/pages/AssignedOrdersListPage'
import { WorkOrderDetailPage } from '@/features/work-orders/pages/WorkOrderDetailPage'

type ActiveView = 'list' | 'detail'

function App() {
  const [currentView, setCurrentView] = useState<ActiveView>('list')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id)
    setCurrentView('detail')
  }

  const handleBack = () => {
    setSelectedOrderId(null)
    setCurrentView('list')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                    LOS FRATELLI
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground hidden sm:inline">
                    | Consola Mecanico
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Panel de Trabajo Operativo
                </p>
              </div>
            </div>

            {/* RN-16 Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs font-semibold text-muted-foreground">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">RN-16: Sin costos visibles</span>
              <span className="sm:hidden">Sin costos</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentView === 'list' && (
          <AssignedOrdersListPage onSelectOrder={handleSelectOrder} />
        )}

        {currentView === 'detail' && selectedOrderId && (
          <WorkOrderDetailPage orderId={selectedOrderId} onBack={handleBack} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card py-5 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <strong className="text-foreground">Taller Mecanico &quot;Los Fratelli&quot; S.R.L.</strong>
            <span>| Consola del Mecanico</span>
          </div>
          <div className="flex items-center gap-4">
            <span>La Paz, Bolivia</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
