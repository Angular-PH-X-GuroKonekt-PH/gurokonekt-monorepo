import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PasswordResetService } from './password-reset.service';
import { buildApiUrl } from '../../../shared/utils/api.util';

const EMAIL = 'admin@gurokonekt.com';
const PASSWORD = 'NewPassw0rd!';
const ACCESS_TOKEN = 'recovery-access-token';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PasswordResetService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PasswordResetService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('requestReset', () => {
    it('posts the email to the forgot-password endpoint', () => {
      service.requestReset(EMAIL).subscribe();

      const req = http.expectOne(buildApiUrl('/auth/forgot-password'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: EMAIL });
      req.flush({ message: 'Reset link sent' });
    });

    it('surfaces the server message on success', async () => {
      const result = service.requestReset(EMAIL).toPromise();

      http.expectOne(buildApiUrl('/auth/forgot-password')).flush({ message: 'Reset link sent' });

      expect(await result).toBe('Reset link sent');
    });

    it('reports the server message when the email is unknown', async () => {
      const result = service.requestReset(EMAIL).toPromise();

      http
        .expectOne(buildApiUrl('/auth/forgot-password'))
        .flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });

      await expect(result).rejects.toMatchObject({ message: 'User not found' });
    });

    it('falls back to a generic message when the server sends none', async () => {
      const result = service.requestReset(EMAIL).toPromise();

      http
        .expectOne(buildApiUrl('/auth/forgot-password'))
        .flush(null, { status: 500, statusText: 'Server Error' });

      await expect(result).rejects.toMatchObject({
        message: 'An unexpected error occurred. Please try again.',
      });
    });
  });

  describe('completeReset', () => {
    it('posts the recovery token and new password to the complete endpoint', () => {
      service.completeReset({ accessToken: ACCESS_TOKEN, newPassword: PASSWORD }).subscribe();

      const req = http.expectOne(buildApiUrl('/auth/complete-password-reset'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        accessToken: ACCESS_TOKEN,
        newPassword: PASSWORD,
        confirmPassword: PASSWORD,
      });
      req.flush({ message: 'Password updated' });
    });

    it('reports an expired recovery link', async () => {
      const result = service
        .completeReset({ accessToken: ACCESS_TOKEN, newPassword: PASSWORD })
        .toPromise();

      http
        .expectOne(buildApiUrl('/auth/complete-password-reset'))
        .flush({ message: 'Reset link expired' }, { status: 400, statusText: 'Bad Request' });

      await expect(result).rejects.toMatchObject({ message: 'Reset link expired' });
    });
  });
});
