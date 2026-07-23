import { resolveHelpBackTarget, roleDashboardPath } from './helpNavigation';

describe('Help navigation', () => {
  test('uses browser history when a previous page exists', () => {
    expect(resolveHelpBackTarget({
      historyIndex: 2,
      isAuthenticated: true,
      role: 'Test Taker'
    })).toBe(-1);
  });

  test.each([
    ['Test Taker', '/dashboard'],
    ['Test Administrator', '/test-administrator'],
    ['System Administrator', '/admin/dashboard']
  ])('uses the %s dashboard when history is unavailable', (role, expected) => {
    expect(roleDashboardPath(role)).toBe(expected);
    expect(resolveHelpBackTarget({
      historyIndex: 0,
      isAuthenticated: true,
      role
    })).toBe(expected);
  });

  test('uses the public home route for an unauthenticated visitor', () => {
    expect(resolveHelpBackTarget({
      historyIndex: 0,
      isAuthenticated: false
    })).toBe('/');
  });
});
