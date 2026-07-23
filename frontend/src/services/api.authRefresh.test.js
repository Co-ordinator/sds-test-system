jest.mock('axios', () => ({
  create: jest.fn()
}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('API authentication refresh handling', () => {
  let api;
  let rejectResponse;

  beforeEach(() => {
    jest.resetModules();
    const axios = require('axios');
    const fakeApi = jest.fn((config) => Promise.resolve({ status: 200, config }));
    fakeApi.post = jest.fn();
    fakeApi.interceptors = {
      response: {
        use: jest.fn((onSuccess, onError) => {
          rejectResponse = onError;
          return 1;
        })
      }
    };
    axios.create.mockReturnValue(fakeApi);
    api = require('./api').default;
  });

  test('concurrent 401 responses share one refresh request and retry once each', async () => {
    const refresh = deferred();
    api.post.mockReturnValue(refresh.promise);
    const firstConfig = { url: '/api/v1/admin/users' };
    const secondConfig = { url: '/api/v1/analytics/overview' };

    const first = rejectResponse({ config: firstConfig, response: { status: 401 } });
    const second = rejectResponse({ config: secondConfig, response: { status: 401 } });

    expect(api.post).toHaveBeenCalledTimes(1);
    refresh.resolve({ status: 200 });
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(api).toHaveBeenCalledTimes(2);
    expect(firstConfig._retry).toBe(true);
    expect(secondConfig._retry).toBe(true);
  });

  test('a true refresh expiry emits one session-expired event', async () => {
    const events = [];
    const listener = () => events.push('expired');
    window.addEventListener('auth:session-expired', listener);
    api.post.mockRejectedValue({ response: { status: 401 }, message: 'expired' });

    await expect(rejectResponse({
      config: { url: '/api/v1/admin/users' },
      response: { status: 401 }
    })).rejects.toBeDefined();

    expect(events).toEqual(['expired']);
    window.removeEventListener('auth:session-expired', listener);
  });

  test('a transient server error does not expire the session', async () => {
    const listener = jest.fn();
    window.addEventListener('auth:session-expired', listener);

    await expect(rejectResponse({
      config: { url: '/api/v1/admin/users' },
      response: { status: 503 }
    })).rejects.toBeDefined();

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('auth:session-expired', listener);
  });

  test('an anonymous startup probe does not emit session expiry', async () => {
    const listener = jest.fn();
    window.addEventListener('auth:session-expired', listener);
    api.post.mockRejectedValue({ response: { status: 401 }, message: 'no refresh cookie' });

    await expect(rejectResponse({
      config: {
        url: '/api/v1/auth/me',
        suppressSessionExpired: true
      },
      response: { status: 401 }
    })).rejects.toBeDefined();

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('auth:session-expired', listener);
  });

  test('a refresh service outage does not report the session as expired', async () => {
    const listener = jest.fn();
    window.addEventListener('auth:session-expired', listener);
    api.post.mockRejectedValue({ response: { status: 503 }, message: 'database busy' });

    await expect(rejectResponse({
      config: { url: '/api/v1/admin/users' },
      response: { status: 401 }
    })).rejects.toBeDefined();

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('auth:session-expired', listener);
  });
});
