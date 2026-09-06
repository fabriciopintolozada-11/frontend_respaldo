import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { authServer } from './msw-auth-handlers';

beforeAll(() => authServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  authServer.resetHandlers();
});
afterAll(() => authServer.close());
