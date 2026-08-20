import { createBrowserRouter, Navigate } from 'react-router';

import { TrackingPublicPage } from '../features/tracking-public/pages/TrackingPublicPage';
import { WorkshopLayout } from './workshop-layout';
import { WorkshopHeadView } from '../features/workshop/WorkshopHeadView';
import { MechanicConsoleView } from '../features/workshop/MechanicConsoleView';
import { WorkOrdersListView } from '../features/workshop/WorkOrdersListView';
import { WorkOrderDetailView } from '../features/workshop/WorkOrderDetailView';

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
        element: <WorkshopHeadView />,
      },
      {
        path: 'mecanico',
        element: <MechanicConsoleView />,
      },
      {
        path: 'ots',
        element: <WorkOrdersListView />,
      },
      {
        path: 'ots/:orderId',
        element: <WorkOrderDetailView />,
      },
      {
        path: 'consulta',
        element: <TrackingPublicPage />,
      },
    ],
  },
]);