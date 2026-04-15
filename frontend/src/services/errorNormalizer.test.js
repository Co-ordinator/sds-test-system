import { normalizeApiError } from './errorNormalizer';

describe('normalizeApiError', () => {
  it('maps backend envelope to UI shape', () => {
    const error = {
      response: {
        status: 403,
        data: {
          code: 'FORBIDDEN_ERROR',
          message: 'Forbidden',
          requestId: 'req-123'
        }
      }
    };
    const normalized = normalizeApiError(error);
    expect(normalized.status).toBe(403);
    expect(normalized.code).toBe('FORBIDDEN_ERROR');
    expect(normalized.requestId).toBe('req-123');
    expect(normalized.uiMessage).toBe('Forbidden');
  });

  it('uses fallback status-based message when payload missing', () => {
    const normalized = normalizeApiError({ response: { status: 500, data: {} } });
    expect(normalized.code).toBe('UNKNOWN_ERROR');
    expect(normalized.uiMessage).toContain('Something went wrong');
  });
});
