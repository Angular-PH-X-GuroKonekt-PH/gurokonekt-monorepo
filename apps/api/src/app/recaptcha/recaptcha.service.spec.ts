import { Test, TestingModule } from '@nestjs/testing';
import {
  RECAPTCHA_MIN_SCORE,
  RECAPTCHA_VERIFY_URL,
  RecaptchaFailureReason,
  RecaptchaService,
} from './recaptcha.service';

const TOKEN = 'test-token';

const googleResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
  } as Response);

describe('RecaptchaService', () => {
  const originalEnv = process.env;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env = { ...originalEnv };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  async function build(): Promise<RecaptchaService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecaptchaService],
    }).compile();
    return module.get(RecaptchaService);
  }

  describe('with a configured secret', () => {
    beforeEach(() => {
      process.env['RECAPTCHA_SECRET_KEY'] = 'secret';
    });

    it('passes a submission scoring above the threshold', async () => {
      fetchMock.mockReturnValue(googleResponse({ success: true, score: 0.9 }));

      const result = await (await build()).verify(TOKEN);

      expect(result.ok).toBe(true);
    });

    it('passes a submission exactly at the threshold', async () => {
      fetchMock.mockReturnValue(
        googleResponse({ success: true, score: RECAPTCHA_MIN_SCORE }),
      );

      expect((await (await build()).verify(TOKEN)).ok).toBe(true);
    });

    it('rejects a submission scoring below the threshold', async () => {
      fetchMock.mockReturnValue(googleResponse({ success: true, score: 0.1 }));

      const result = await (await build()).verify(TOKEN);

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe(
        RecaptchaFailureReason.LowScore,
      );
    });

    it('rejects when Google reports success: false', async () => {
      fetchMock.mockReturnValue(
        googleResponse({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
      );

      const result = await (await build()).verify(TOKEN);

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe(
        RecaptchaFailureReason.Rejected,
      );
    });

    // Failing open here would be a trivial bypass: knock the verifier offline,
    // then spam freely.
    it('rejects when the network call fails', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await (await build()).verify(TOKEN);

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe(
        RecaptchaFailureReason.Unavailable,
      );
    });

    it('rejects when Google returns a non-200', async () => {
      fetchMock.mockReturnValue(googleResponse({}, false));

      const result = await (await build()).verify(TOKEN);

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe(
        RecaptchaFailureReason.Unavailable,
      );
    });

    it('posts the secret and token form-encoded to Google', async () => {
      fetchMock.mockReturnValue(googleResponse({ success: true, score: 0.9 }));

      await (await build()).verify(TOKEN);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(RECAPTCHA_VERIFY_URL);
      expect(init.method).toBe('POST');
      const body = init.body as URLSearchParams;
      expect(body.get('secret')).toBe('secret');
      expect(body.get('response')).toBe(TOKEN);
    });
  });

  describe('with no secret configured', () => {
    beforeEach(() => {
      delete process.env['RECAPTCHA_SECRET_KEY'];
    });

    it('skips verification in development so local work is not blocked', async () => {
      process.env['NODE_ENV'] = 'development';

      const result = await (await build()).verify(TOKEN);

      expect(result.ok).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects everything outside development', async () => {
      process.env['NODE_ENV'] = 'production';

      const result = await (await build()).verify(TOKEN);

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe(
        RecaptchaFailureReason.NotConfigured,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('treats an empty string secret as unconfigured', async () => {
      process.env['RECAPTCHA_SECRET_KEY'] = '';
      process.env['NODE_ENV'] = 'production';

      const result = await (await build()).verify(TOKEN);

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe(
        RecaptchaFailureReason.NotConfigured,
      );
    });
  });
});
