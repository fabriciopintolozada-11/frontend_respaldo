import { createBrowserRouter, Navigate } from 'react-router';

import { WorkshopLayout } from './workshop-layout';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import type { UserRole } from '../shared/types/openapi';
import { LoginPage } from '../features/auth/pages/LoginPage';

const RECEPTION_AND_LEAD: UserRole[] = ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'];
const LEAD_AND_ADMIN: UserRole[] = ['WORKSHOP_LEAD', 'ADMIN'];
const MECHANIC_ONLY: UserRole[] = ['MECHANIC'];

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <WorkshopLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/taller" replace />,
      },
      {
        element: <ProtectedRoute allowedRoles={LEAD_AND_ADMIN} />,
        children: [
          {
            path: 'taller',
            lazy: async () => ({
              Component: (await import('../features/workshop/WorkshopHeadView')).WorkshopHeadView,
            }),
          },
          {
            path: 'inventario',
            lazy: async () => ({
              Component: (await import('../features/inventory/pages/InventoryManagerView')).InventoryManagerView,
            }),
          },
          {
            path: 'inventario/alertas',
            lazy: async () => ({
              Component: (await import('../features/inventory/pages/InventoryAlertsView')).InventoryAlertsView,
            }),
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={RECEPTION_AND_LEAD} />,
        children: [
          {
            path: 'recepcion',
            lazy: async () => ({
              Component: (await import('../features/reception/vehicle-reception-page')).VehicleReceptionPage,
            }),
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={MECHANIC_ONLY} />,
        children: [
          {
            path: 'mecanico',
            lazy: async () => ({
              Component: (await import('../features/mechanic-view/pages/MechanicConsoleView')).MechanicConsoleView,
            }),
          },
        ],
      },
      {
        path: 'presupuestos/crear',
        lazy: async () => ({
          Component: (await import('../features/quote-creation/pages/QuoteCreationPage')).QuoteCreationPage,
        }),
      },
      {
        path: 'presupuestos/crear/:orderId',
        lazy: async () => ({
          Component: (await import('../features/quote-creation/pages/QuoteCreationPage')).QuoteCreationPage,
        }),
      },
      {
        path: 'presupuestos/:orderId',
        lazy: async () => ({
          Component: (await import('../features/budget-approval/pages/BudgetApprovalPage')).BudgetApprovalPage,
        }),
      },
    ],
  },
  {
    path: '/consulta',
    lazy: async () => ({
      Component: (await import('../features/tracking-public/pages/PublicTrackingPage')).PublicTrackingPage,
    }),
  },
]);
