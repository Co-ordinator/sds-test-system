const STATUS_MESSAGES = {
  400: 'Your request could not be processed.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred while processing your request.',
  422: 'Some fields are invalid. Please review and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again shortly.',
  502: 'The service is temporarily unavailable.',
  503: 'The service is temporarily unavailable.'
};

export const normalizeApiError = (error) => {
  const status = error?.response?.status || 0;
  const payload = error?.response?.data || {};
  const code = payload.code || 'UNKNOWN_ERROR';
  const requestId = payload.requestId || null;
  const details = payload.details || null;
  const uiMessage = payload.message || STATUS_MESSAGES[status] || 'Unexpected error. Please try again.';
  return {
    status,
    code,
    requestId,
    uiMessage,
    details,
    raw: error
  };
};
