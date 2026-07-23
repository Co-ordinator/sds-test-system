import { isPublicRoute } from './authRoutes';

describe('authentication route classification', () => {
  test.each([
    '/',
    '/about',
    '/login',
    '/register',
    '/forgot-password',
    '/verify-otp',
    '/reset-password/example-token'
  ])('keeps %s public for anonymous visitors', (pathname) => {
    expect(isPublicRoute(pathname)).toBe(true);
  });

  test.each([
    '/admin',
    '/admin/dashboard',
    '/test-administrator',
    '/dashboard'
  ])('requires authentication for %s', (pathname) => {
    expect(isPublicRoute(pathname)).toBe(false);
  });
});
