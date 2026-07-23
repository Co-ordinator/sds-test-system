const PUBLIC_ROUTES = new Set([
  '/',
  '/about',
  '/help',
  '/register',
  '/login',
  '/forgot-password',
  '/verify-otp',
  '/verify-email'
]);

export const isPublicRoute = (pathname = '/') => (
  PUBLIC_ROUTES.has(pathname)
  || pathname.startsWith('/verify-email/')
  || pathname.startsWith('/reset-password/')
);
