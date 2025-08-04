import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout';
import { ProtectedRoute } from './auth/components';
import {
  HomePage,
  RoomsPage,
  RoomDetailsPage,
  NewRoomPage,
  EditRoomPage,
  AvailabilityPage,
  LoginPage,
  ForbiddenPage,
  NotFoundPage
} from './pages';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/forbidden',
    element: <ForbiddenPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />
      },
      {
        path: 'home',
        element: <HomePage />
      },
      {
        path: 'rooms',
        element: <RoomsPage />
      },
      {
        path: 'rooms/new',
        element: (
          <ProtectedRoute requiredPermission="ADMIN_ACCESS">
            <NewRoomPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'rooms/:id',
        element: <RoomDetailsPage />
      },
      {
        path: 'rooms/:id/edit',
        element: (
          <ProtectedRoute requiredPermission="ADMIN_ACCESS">
            <EditRoomPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'availability',
        element: <AvailabilityPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

export default router; 