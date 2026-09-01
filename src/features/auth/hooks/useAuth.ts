import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, login as loginRequest, type AuthResponse, type LoginCredentials, type UserProfile } from '../api/auth-api';

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      queryClient.setQueryData<UserProfile>(['auth', 'profile'], {
        id: data.id,
        fullName: data.fullName,
        username: data.username,
        role: data.role,
        isActive: true,
      });
    },
  });
}

export function useProfile() {
  return useQuery<UserProfile, Error>({
    queryKey: ['auth', 'profile'],
    queryFn: getProfile,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return {
    logout: () => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear();
    },
  };
}