import { HttpErrorResponse } from '@angular/common/http';
import { getErrorMessage } from './http-error.util';

const buildHttpError = (status: number, body: unknown, url = '/api/search/recommended') =>
  new HttpErrorResponse({ status, error: body, url });

describe('getErrorMessage', () => {
  it('never surfaces the express router message for a missing route', () => {
    const error = buildHttpError(404, {
      message: 'Cannot GET /api/search/recommended?limit=6',
      error: 'Not Found',
      statusCode: 404,
    });

    const message = getErrorMessage(error);

    expect(message).not.toContain('Cannot GET');
    expect(message).not.toContain('/api/');
  });

  it('discards an express router message on any status, not just 404', () => {
    const error = buildHttpError(405, {
      message: 'Cannot POST /api/search/recommended',
    });

    const message = getErrorMessage(error);

    expect(message).not.toContain('Cannot POST');
    expect(message).not.toContain('/api/');
  });

  it('still surfaces a meaningful server message on a 400', () => {
    const error = buildHttpError(400, { message: 'Session rate must be positive.' });

    expect(getErrorMessage(error)).toBe('Session rate must be positive.');
  });

  it('falls back to a generic message when the body carries no message', () => {
    const error = buildHttpError(404, null);

    expect(getErrorMessage(error)).not.toContain('Http failure');
  });
});
