import { createBrowserRouter, Navigate } from 'react-router';

import { WorkshopLayout } from './workshop-layout';
import { AuthLayout } from './auth-layout';
import { ProtectedRoute } from './protected-route';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { WorkshopHeadView } from '../features/workshop/WorkshopHeadView';
import { VehicleReceptionPage } from '../features/reception/vehicle-reception-page';
import { MechanicConsoleView } from '../features/mechanic-view/pages/MechanicConsoleView';
import { WorkOrdersListView } from '../features/workshop/WorkOrdersListView';
import { WorkOrderDetailView } from '../features/workshop/WorkOrderDetailView';
import { BudgetApprovalPage } from '../features/budget-approval/pages/BudgetApprovalPage';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <WorkshopLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/taller" replace />,
          },
          {
            path: 'taller',
            element: (
              <ProtectedRoute roles={['WORKSHOP_LEAD', 'ADMIN']}>
                <WorkshopHeadView />
              </ProtectedRoute>
            ),
          },
          {
            path: 'recepcion',
            element: (
              <ProtectedRoute roles={['RECEPTIONIST', 'ADMIN']}>
                <VehicleReceptionPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'mecanico',
            element: (
              <ProtectedRoute roles={['MECHANIC', 'ADMIN']}>
                <MechanicConsoleView />
              </ProtectedRoute>
            ),
          },
          {
            path: 'ots',
            element: (
              <ProtectedRoute roles={['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN']}>
                <WorkOrdersListView />
              </ProtectedRoute>
            ),
          },
          {
            path: 'ots/:orderId',
            element: (
              <ProtectedRoute roles={['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN']}>
                <WorkOrderDetailView />
              </ProtectedRoute>
            ),
          },
          {
            path: 'presupuestos',
            element: (
              <ProtectedRoute roles={['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN']}>
                <BudgetApprovalPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'presupuestos/:orderId',
            element: (
              <ProtectedRoute roles={['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN']}>
                <BudgetApprovalPage />
              </ProtectedRoute>
            ),
          },
        ],
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