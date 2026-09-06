import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import * as authService from '../api/auth-service';
import { setAuthToken } from '../../../shared/api/httpClient';

const STORAGE_KEY = 'fratelli_refresh_token';

export interface AuthState {
  user: authService.AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<authService.AuthUser>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeRefreshToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // storage full or unavailable
  }
}

function clearStoredRefreshToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

let refreshPromise: Promise<boolean> | null = null;

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<authService.AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyTokens = useCallback((tokens: authService.AuthTokens, userData: authService.AuthUser) => {
    setAccessToken(tokens.accessToken);
    setAuthToken(tokens.accessToken);
    setUser(userData);
    storeRefreshToken(tokens.refreshToken);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setAuthToken(null);
    setUser(null);
    clearStoredRefreshToken();
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const stored = getStoredRefreshToken();
    if (!stored) {
      logout();
      return false;
    }

    try {
      const response = await authService.refresh(stored);
      applyTokens(response, {
        id: response.id,
        fullName: response.fullName,
        username: response.username,
        role: response.role,
      });
      return true;
    } catch {
      logout();
      return false;
    }
  }, [logout, applyTokens]);

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await authService.login(username, password);
      const userData: authService.AuthUser = {
        id: response.id,
        fullName: response.fullName,
        username: response.username,
        role: response.role,
      };
      applyTokens(response, userData);
      return userData;
    },
    [applyTokens],
  );

  useEffect(() => {
    const stored = getStoredRefreshToken();
    if (!stored) {
      setIsLoading(false);
      return;
    }

    refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!accessToken && !!user,
      isLoading,
      login,
      logout,
      refreshSession,
    }),
    [user, accessToken, isLoading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const stored = getStoredRefreshToken();
    if (!stored) return false;

    try {
      const response = await authService.refresh(stored);
      setAuthToken(response.accessToken);
      storeRefreshToken(response.refreshToken);
      return true;
    } catch {
      clearStoredRefreshToken();
      setAuthToken(null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
