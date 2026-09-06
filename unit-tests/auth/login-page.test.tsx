import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { authServer } from './msw-auth-handlers';

import { LoginPage } from '../../src/features/auth/pages/LoginPage';
import { AuthContext, type AuthContextValue } from '../../src/features/auth/providers/AuthProvider';

function renderLoginPage(overrides: Partial<AuthContextValue> = {}) {
  const loginFn = overrides.login ?? vi.fn().mockResolvedValue({
    id: 'user-1',
    fullName: 'Recepcionista Uno',
    username: 'recep01',
    role: 'RECEPTIONIST',
  });
  const contextValue: AuthContextValue = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    login: loginFn,
    logout: vi.fn(),
    refreshSession: vi.fn(),
    ...overrides,
  };

  return {
    loginFn,
    ...render(
      <AuthContext.Provider value={contextValue}>
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    ),
  };
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form with username and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty fields', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre de usuario es obligatorio')).toBeInTheDocument();
    });
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
  });

  it('calls login function with form data on valid submission', async () => {
    const user = userEvent.setup();
    const { loginFn } = renderLoginPage();

    await user.type(screen.getByLabelText(/usuario/i), 'recep01');
    await user.type(screen.getByLabelText(/contraseña/i), 'Fratelli2026!');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(loginFn).toHaveBeenCalledWith('recep01', 'Fratelli2026!');
    });
  });

  it('displays server error message when login fails', async () => {
    const user = userEvent.setup();
    const loginFn = vi.fn().mockRejectedValue(new Error('Credenciales de acceso incorrectas o usuario inactivo'));
    renderLoginPage({ login: loginFn });

    await user.type(screen.getByLabelText(/usuario/i), 'recep01');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales de acceso incorrectas o usuario inactivo');
    });
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();
    let resolveLogin!: (value: AuthContextValue) => void;
    const loginFn = vi.fn(
      () => new Promise<AuthContextValue>((resolve) => { resolveLogin = resolve; }),
    );
    renderLoginPage({ login: loginFn });

    await user.type(screen.getByLabelText(/usuario/i), 'recep01');
    await user.type(screen.getByLabelText(/contraseña/i), 'Fratelli2026!');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/ingresando/i)).toBeInTheDocument();
    });

    resolveLogin({
      user: { id: '1', fullName: 'Test', username: 'test', role: 'RECEPTIONIST' },
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });
  });
});
