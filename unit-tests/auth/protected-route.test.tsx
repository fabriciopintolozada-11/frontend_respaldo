import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { ProtectedRoute } from '../../src/features/auth/components/ProtectedRoute';
import { AuthContext, type AuthContextValue } from '../../src/features/auth/providers/AuthProvider';

function createAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
    ...overrides,
  };
}

function renderWithAuth(authOverrides: Partial<AuthContextValue> = {}, initialEntry = '/taller') {
  const contextValue = createAuthContext(authOverrides);
  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/taller"
            element={<ProtectedRoute allowedRoles={['WORKSHOP_LEAD', 'ADMIN']} />}
          >
            <Route index element={<div>Workshop View</div>} />
          </Route>
          <Route
            path="/mecanico"
            element={<ProtectedRoute allowedRoles={['MECHANIC']} />}
          >
            <Route index element={<div>Mechanic View</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading spinner while checking authentication', () => {
    renderWithAuth({ isLoading: true });
    expect(screen.getByText('Cargando sesión...')).toBeInTheDocument();
  });

  it('redirects to /login when the user is not authenticated', () => {
    renderWithAuth({ user: null, isAuthenticated: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders the child route when the user has an allowed role', () => {
    renderWithAuth({
      user: { id: '1', fullName: 'Jefe', username: 'lead01', role: 'WORKSHOP_LEAD' },
      isAuthenticated: true,
      isLoading: false,
    });
    expect(screen.getByText('Workshop View')).toBeInTheDocument();
  });

  it('redirects to the role default route when the user does not have an allowed role', () => {
    renderWithAuth(
      {
        user: { id: '1', fullName: 'Mecánico', username: 'mech01', role: 'MECHANIC' },
        isAuthenticated: true,
        isLoading: false,
      },
      '/taller',
    );
    expect(screen.getByText('Mechanic View')).toBeInTheDocument();
  });

  it('redirects to /login when there is no user even if isLoading is false', () => {
    renderWithAuth({ user: null, isAuthenticated: false, isLoading: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
