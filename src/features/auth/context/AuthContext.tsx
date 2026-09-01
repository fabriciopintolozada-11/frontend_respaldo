import React, { createContext, useContext } from 'react';
import { useLogin, useProfile, type AuthState } from '../hooks/useAuth';
import { clearSession, type LoginCredentials, type AuthResponse } from '../api/auth-api';

const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuthContext(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const profile = useProfile();
  const loginMutation = useLogin();

  const user = profile.data ?? null;
  const isLoading = profile.isPending;

  const login = (credentials: LoginCredentials): Promise<AuthResponse> => {
    return loginMutation.mutateAsync(credentials);
  };

  const logout = (): void => {
    clearSession();
    window.location.assign('/auth/login');
  };

  const value: AuthState = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}