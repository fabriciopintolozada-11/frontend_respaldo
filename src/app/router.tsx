import { createBrowserRouter, Navigate } from 'react-router';

import { WorkshopLayout } from './workshop-layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <WorkshopLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/taller" replace />,
      },
      {
        path: 'taller',
        lazy: async () => ({
          Component: (await import('../features/workshop/WorkshopHeadView')).WorkshopHeadView,
        }),
      },
      {
        path: 'recepcion',
        lazy: async () => ({
          Component: (await import('../features/reception/vehicle-reception-page')).VehicleReceptionPage,
        }),
      },
      {
        path: 'mecanico',
        lazy: async () => ({
          Component: (await import('../features/mechanic/pages/MechanicConsoleView')).MechanicConsoleView,
        }),
      },
      {
        path: 'ots',
        lazy: async () => ({
          Component: (await import('../features/workshop/WorkOrdersListView')).WorkOrdersListView,
        }),
      },
      {
        path: 'ots/:orderId',
        lazy: async () => ({
          Component: (await import('../features/workshop/WorkOrderDetailView')).WorkOrderDetailView,
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
