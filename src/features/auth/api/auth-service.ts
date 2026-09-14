import { httpClient } from '../../../shared/api/httpClient';

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  role: 'RECEPTIONIST' | 'MECHANIC' | 'WORKSHOP_LEAD' | 'ADMIN';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens, AuthUser {}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const { data } = await httpClient.post<AuthResponse>('/auth/login', { username, password });
  return data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await httpClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  return data;
}

export async function getProfile(): Promise<AuthUser & { isActive: boolean }> {
  const { data } = await httpClient.get<AuthUser & { isActive: boolean }>('/auth/profile');
  return data;
}

// US-00 / BE-E10: the server revokes the refresh token (denylist) so a leaked
// token cannot be reused. Requires a valid bearer access token, which the
// httpClient injects automatically.
export async function logout(refreshToken: string): Promise<void> {
  await httpClient.post('/auth/logout', { refreshToken });
}
