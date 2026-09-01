import { httpClient, setAccessToken, clearAccessToken } from '../../../shared/api/httpClient';

export type UserRole = 'RECEPTIONIST' | 'MECHANIC' | 'WORKSHOP_LEAD' | 'ADMIN';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
  isActive: boolean;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await httpClient.post<AuthResponse>('/auth/login', credentials);
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const response = await httpClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function getProfile(): Promise<UserProfile> {
  const response = await httpClient.get<UserProfile>('/auth/profile');
  return response.data;
}

export function clearSession(): void {
  clearAccessToken();
}