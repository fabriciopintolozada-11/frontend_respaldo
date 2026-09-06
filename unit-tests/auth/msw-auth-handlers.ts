import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const loginResponse = {
  accessToken: 'eyJhbGciOiJIUzI1NiJ9.test-access-token',
  refreshToken: 'eyJhbGciOiJIUzI1NiJ9.test-refresh-token',
  id: '00000000-0000-4000-8000-000000000010',
  fullName: 'Recepcionista Uno',
  username: 'recep01',
  role: 'RECEPTIONIST' as const,
};

const profileResponse = {
  id: '00000000-0000-4000-8000-000000000010',
  fullName: 'Recepcionista Uno',
  username: 'recep01',
  role: 'RECEPTIONIST' as const,
  isActive: true,
};

export const authHandlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string };

    if (!body.username || !body.password) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Validation failed', path: '/api/v1/auth/login' },
        { status: 400 },
      );
    }

    if (body.username === 'recep01' && body.password === 'Fratelli2026!') {
      return HttpResponse.json(loginResponse);
    }

    return HttpResponse.json(
      { statusCode: 401, message: 'Credenciales de acceso incorrectas o usuario inactivo' },
      { status: 401 },
    );
  }),

  http.post('/api/v1/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };

    if (body.refreshToken === 'eyJhbGciOiJIUzI1NiJ9.test-refresh-token') {
      return HttpResponse.json({
        ...loginResponse,
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.new-access-token',
        refreshToken: 'eyJhbGciOiJIUzI1NiJ9.new-refresh-token',
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
      return HttpResponse.json(
        { statusCode: 401, message: 'Unauthorized' },
        { status: 401 },
      );
    }
    return HttpResponse.json(profileResponse);
  }),
];

export const authServer = setupServer(...authHandlers);
