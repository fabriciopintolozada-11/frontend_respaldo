<<<<<<< HEAD
import React, { useState } from 'react';
import {
  Wrench,
  Car,
  Layers,
  FileText,
  Package,
  FileCheck,
  DollarSign,
  Globe,
  Sun,
  Moon,
  ShieldCheck,
  Menu,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { ToastProvider, useToast } from '../shared/components/ToastContext';
import { VehicleReceptionView } from '../features/reception/pages/VehicleReceptionView';
import { WorkshopHeadView } from '../features/workshop-head/pages/WorkshopHeadView';
import { MechanicConsoleView } from '../features/mechanic/pages/MechanicConsoleView';
import { WorkOrdersListView } from '../features/work-orders/pages/WorkOrdersListView';
import { WorkOrderDetailView } from '../features/work-orders/pages/WorkOrderDetailView';
import { InventoryManagerView } from '../features/inventory/pages/InventoryManagerView';
import { BudgetsAndApprovalsView } from '../features/budgets/pages/BudgetsAndApprovalsView';
import { WorkshopSettlementView } from '../features/billing/pages/WorkshopSettlementView';
import { ClientPublicPortalView } from '../features/client-portal/pages/ClientPublicPortalView';
import { resetStorageToSeed } from '../shared/api/mock-db';
import { isBackendMode } from '../shared/api/api-client';

type ActiveView =
  | 'reception'
  | 'workshop-head'
  | 'mechanic'
  | 'work-orders'
  | 'work-order-detail'
  | 'inventory'
  | 'budgets'
  | 'billing'
  | 'client-portal';

interface NavItem {
  id: ActiveView;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  badge?: string;
  isPublic?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'reception',
    label: '1. Recepción (HU-01)',
    shortLabel: 'Recepción',
    icon: <Car className="w-4 h-4" />,
  },
  {
    id: 'workshop-head',
    label: '2. Jefe de Taller (4 Bahías)',
    shortLabel: 'Jefe Taller',
    icon: <Layers className="w-4 h-4" />,
    badge: '4 Bahías',
  },
  {
    id: 'mechanic',
    label: '3. Consola Mecánico (RN-16)',
    shortLabel: 'Mecánico',
    icon: <Wrench className="w-4 h-4" />,
    badge: 'Sin Precios',
  },
  {
    id: 'work-orders',
    label: '4. Órdenes de Trabajo',
    shortLabel: 'OTs',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'inventory',
    label: '5. Inventario & Repuestos',
    shortLabel: 'Inventario',
    icon: <Package className="w-4 h-4" />,
    badge: 'RN-10',
  },
  {
    id: 'budgets',
    label: '6. Presupuestos (RN-02)',
    shortLabel: 'Presupuestos',
    icon: <FileCheck className="w-4 h-4" />,
  },
  {
    id: 'billing',
    label: '7. Liquidación / Caja (RN-21)',
    shortLabel: 'Caja BOB',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    id: 'client-portal',
    label: '8. Portal Cliente (RN-17)',
    shortLabel: 'Portal Cliente',
    icon: <Globe className="w-4 h-4" />,
    isPublic: true,
  },
];

const MainAppContent: React.FC = () => {
  const toast = useToast();
  const [currentView, setCurrentView] = useState<ActiveView>('workshop-head');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentView('work-order-detail');
    setIsMobileMenuOpen(false);
  };

  const handleResetData = () => {
    if (isBackendMode) {
      toast.info('Datos administrados por el backend', 'El reinicio de datos solo está disponible en modo mock.');
      return;
    }
    if (window.confirm('¿Desea restablecer todos los datos del taller al estado inicial con ejemplos?')) {
      resetStorageToSeed();
      toast.info('Datos Restablecidos', 'Se reiniciaron las órdenes, bahías e inventario.');
      window.location.reload();
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#0A0C0F] text-[#E0E2E6]' : 'bg-[#0F1115] text-[#E0E2E6]'}`}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#16191F]/95 backdrop-blur-md border-b border-[#2D3139] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Workshop Identity */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                setCurrentView('workshop-head');
                setSelectedOrderId(null);
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                    LOS FRATELLI
                  </span>
                  <span className="text-[10px] font-semibold text-[#8E949F] hidden sm:inline">| Gestión de Taller</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#2D3139] rounded-full text-[10px] font-semibold text-[#22C55E]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
                    4 BAHÍAS
                  </div>
                </div>
                <p className="text-[11px] text-[#8E949F] font-medium">Vehículos Livianos • Sistema Integral</p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden xl:flex items-center gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  currentView === item.id ||
                  (item.id === 'work-orders' && currentView === 'work-order-detail');

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentView(item.id);
                      if (item.id !== 'work-order-detail') setSelectedOrderId(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px] whitespace-nowrap ${
                      isActive
                        ? 'bg-[#F97316] text-white shadow-xs shadow-orange-950/40'
                        : item.isPublic
                        ? 'bg-[#22C55E15] text-[#22C55E] border border-[#22C55E30] hover:bg-[#22C55E25]'
                        : 'text-[#8E949F] hover:text-[#E0E2E6] hover:bg-[#2D3139]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.shortLabel}</span>
                    {item.badge && !isActive && (
                      <span className="text-[9px] font-mono font-bold bg-[#2D3139] text-[#8E949F] px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Actions: Reset Data, Dark Mode Toggle & Mobile Menu */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetData}
                title="Reiniciar datos de prueba"
                className="p-2 rounded-xl bg-[#1C2028] border border-[#2D3139] text-[#8E949F] hover:text-[#F97316] hover:border-[#F97316]/50 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2 rounded-xl bg-[#1C2028] border border-[#2D3139] text-[#8E949F] hover:text-white hover:bg-[#2D3139] transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Alternar modo visual"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-[#F97316]" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Mobile hamburger button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden p-2 rounded-xl bg-[#1C2028] border border-[#2D3139] text-[#8E949F] hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Sub-nav for Medium Screens (Tablets) */}
        <div className="hidden md:flex xl:hidden border-t border-[#2D3139] bg-[#16191F] px-4 py-2 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                currentView === item.id ||
                (item.id === 'work-orders' && currentView === 'work-order-detail');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentView(item.id);
                    if (item.id !== 'work-order-detail') setSelectedOrderId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] whitespace-nowrap ${
                    isActive
                      ? 'bg-[#F97316] text-white'
                      : 'text-[#8E949F] hover:text-[#E0E2E6] hover:bg-[#2D3139]'
                  }`}
                >
                  {item.icon}
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-[#2D3139] bg-[#16191F] p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                currentView === item.id ||
                (item.id === 'work-orders' && currentView === 'work-order-detail');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentView(item.id);
                    if (item.id !== 'work-order-detail') setSelectedOrderId(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left text-sm font-bold flex items-center justify-between min-h-[44px] ${
                    isActive
                      ? 'bg-[#F97316] text-white'
                      : 'text-[#8E949F] hover:text-[#E0E2E6] hover:bg-[#2D3139]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs font-mono font-normal opacity-80">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentView === 'reception' && (
          <VehicleReceptionView
            onOrderCreated={(orderId) => {
              setSelectedOrderId(orderId);
              setCurrentView('work-order-detail');
            }}
          />
        )}

        {currentView === 'workshop-head' && (
          <WorkshopHeadView onSelectOrder={handleSelectOrder} />
        )}

        {currentView === 'mechanic' && <MechanicConsoleView />}

        {currentView === 'work-orders' && (
          <WorkOrdersListView
            onSelectOrder={handleSelectOrder}
            onNewOrder={() => setCurrentView('reception')}
          />
        )}

        {currentView === 'work-order-detail' && selectedOrderId && (
          <WorkOrderDetailView
            orderId={selectedOrderId}
            onBack={() => {
              setSelectedOrderId(null);
              setCurrentView('work-orders');
            }}
            onNavigateToBilling={(orderId) => {
              setSelectedOrderId(orderId);
              setCurrentView('billing');
            }}
            onNavigateToQuotation={(orderId) => {
              setSelectedOrderId(orderId);
              setCurrentView('budgets');
            }}
          />
        )}

        {currentView === 'inventory' && <InventoryManagerView />}

        {currentView === 'budgets' && (
          <BudgetsAndApprovalsView onSelectOrder={handleSelectOrder} />
        )}

        {currentView === 'billing' && (
          <WorkshopSettlementView
            initialOrderId={selectedOrderId || undefined}
            onSelectOrder={handleSelectOrder}
          />
        )}

        {currentView === 'client-portal' && <ClientPublicPortalView />}
      </main>

      {/* Footer info bar */}
      <footer className="mt-12 border-t border-[#2D3139] bg-[#16191F] py-5 text-xs text-[#8E949F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#F97316]"></div>
            <strong className="text-[#E0E2E6]">Taller Mecánico "Los Fratelli" S.R.L.</strong>
            <span>— Control de Bahías & OTs</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>La Paz, Bolivia</span>
            <span>•</span>
            <span>Moneda: BOB</span>
            <div className="flex items-center gap-2 bg-[#22C55E15] px-3 py-1 rounded-lg border border-[#22C55E30]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
              <span className="text-[11px] text-[#22C55E] font-bold">4 Bahías Operativas</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
=======
import { AppLayout } from '../components/layout/app-layout'
import { VehicleReceptionPage } from '../features/reception/vehicle-reception-page'

export default function App() {
  return (
    <AppLayout>
      <VehicleReceptionPage />
    </AppLayout>
  )
}
>>>>>>> dceda53 (refactor: prepare frontend architecture for api integration)
