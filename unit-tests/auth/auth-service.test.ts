import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { login, refresh, getProfile } from '../../src/features/auth/api/auth-service';
import { setAuthToken } from '../../src/shared/api/httpClient';

const server = setupServer(
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string };
    if (body?.username === 'recep01' && body?.password === 'Fratelli2026!') {
      return HttpResponse.json({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        id: 'user-1',
        fullName: 'Recepcionista Uno',
        username: 'recep01',
        role: 'RECEPTIONIST',
      });
    }
    return HttpResponse.json(
      { statusCode: 401, message: 'Credenciales de acceso incorrectas o usuario inactivo' },
      { status: 401 },
    );
  }),
  http.post('/api/v1/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };
    if (body?.refreshToken === 'refresh-token-456') {
      return HttpResponse.json({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        id: 'user-1',
        fullName: 'Recepcionista Uno',
        username: 'recep01',
        role: 'RECEPTIONIST',
      });
    }
    return HttpResponse.json(
      { statusCode: 401, message: 'Refresh token inválido o expirado' },
      { status: 401 },
    );
  }),
  http.get('/api/v1/auth/profile', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json({
      id: 'user-1',
      fullName: 'Recepcionista Uno',
      username: 'recep01',
      role: 'RECEPTIONIST',
      isActive: true,
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  setAuthToken(null);
});

describe('auth-service', () => {
  describe('login', () => {
    it('returns tokens and user data for valid credentials', async () => {
      const result = await login('recep01', 'Fratelli2026!');

      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-456');
      expect(result.id).toBe('user-1');
      expect(result.fullName).toBe('Recepcionista Uno');
      expect(result.role).toBe('RECEPTIONIST');
    });

    it('throws an error for invalid credentials', async () => {
      await expect(login('recep01', 'wrong-password')).rejects.toThrow();
    });
  });

  describe('refresh', () => {
    it('returns new tokens for a valid refresh token', async () => {
      const result = await refresh('refresh-token-456');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.id).toBe('user-1');
    });

    it('throws an error for an invalid refresh token', async () => {
      await expect(refresh('invalid-token')).rejects.toThrow();
    });
  });

  describe('getProfile', () => {
    it('returns the user profile with a valid token', async () => {
      setAuthToken('valid-access-token');
      const result = await getProfile();

      expect(result.id).toBe('user-1');
      expect(result.username).toBe('recep01');
      expect(result.role).toBe('RECEPTIONIST');
      expect(result.isActive).toBe(true);
    });

    it('throws an error without a token', async () => {
      setAuthToken(null);
      await expect(getProfile()).rejects.toThrow();
    });
  });
});
