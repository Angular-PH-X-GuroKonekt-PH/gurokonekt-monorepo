import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Readable } from 'node:stream';

import { DrainRequestExceptionFilter } from './drain-request.filter';

type ResponseMock = {
  headersSent: boolean;
  statusCode: number | null;
  body: unknown;
  status: (code: number) => ResponseMock;
  json: (payload: unknown) => ResponseMock;
};

function createResponse(): ResponseMock {
  const res: ResponseMock = {
    headersSent: false,
    statusCode: null,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      res.headersSent = true;
      return res;
    },
  };
  return res;
}

function createHost(req: unknown, res: unknown): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;
}

describe('DrainRequestExceptionFilter', () => {
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    // The filter's Logger calls are correct production behavior (surfacing
    // unhandled exceptions and drain-cap breaches) and must stay in place —
    // this only keeps the test output clean, and the assertions below still
    // verify the logging actually happened.
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('waits for an unread request body before writing the error response', async () => {
    const req = new Readable({ read() { /* pushed manually below */ } });
    const res = createResponse();
    const filter = new DrainRequestExceptionFilter();

    const exception = new HttpException(
      { statusCode: 401, message: 'Your session has expired. Please log in again.', errorCode: 'SESSION_EXPIRED' },
      HttpStatus.UNAUTHORIZED,
    );

    const settled = filter.catch(exception, createHost(req, res));

    // The body is still arriving — nothing may be written yet.
    await new Promise((resolve) => setImmediate(resolve));
    expect(res.headersSent).toBe(false);

    req.push(Buffer.alloc(1024));
    req.push(null);
    await settled;

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      statusCode: 401,
      message: 'Your session has expired. Please log in again.',
      errorCode: 'SESSION_EXPIRED',
    });
  });

  it('responds immediately when the body was already consumed', async () => {
    const req = new Readable({ read() { this.push(null); } });
    req.resume();
    await new Promise((resolve) => req.on('end', resolve));

    const res = createResponse();
    const filter = new DrainRequestExceptionFilter();

    await filter.catch(new HttpException('Not Found', HttpStatus.NOT_FOUND), createHost(req, res));

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ statusCode: 404, message: 'Not Found' });
  });

  it('maps a non-HttpException to a 500 without leaking the message', async () => {
    const req = new Readable({ read() { this.push(null); } });
    req.resume();
    await new Promise((resolve) => req.on('end', resolve));

    const res = createResponse();
    const filter = new DrainRequestExceptionFilter();

    await filter.catch(new Error('prisma exploded with a connection string'), createHost(req, res));

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ statusCode: 500, message: 'Internal server error' });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unhandled exception: prisma exploded with a connection string'),
      expect.any(String),
    );
  });

  it('stops draining once the byte cap is hit', async () => {
    let pushed = 0;
    const req = Object.assign(
      new Readable({
        read() {
          pushed += 1;
          this.push(Buffer.alloc(1024 * 1024)); // never ends
        },
      }),
      { method: 'PATCH', url: '/api/user/00000000-0000-0000-0000-000000000000/profile' },
    );
    const res = createResponse();
    const filter = new DrainRequestExceptionFilter({ maxDrainBytes: 4 * 1024 * 1024, drainTimeoutMs: 5000 });

    await filter.catch(new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED), createHost(req, res));

    expect(res.statusCode).toBe(401);
    expect(pushed).toBeLessThan(64);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Drain cap of 4194304 bytes exceeded on PATCH /api/user/00000000-0000-0000-0000-000000000000/profile; responding early',
      ),
    );
  });

  // Step 6 alternative: a running local API wasn't available in this
  // environment to curl-verify byte-for-byte response shapes (no
  // docker-compose.yml at the repo root to bring up Postgres). This test
  // covers the same regression risk directly: ValidationPipe's default
  // BadRequestException carries a `message` array plus an `error` field,
  // and buildBody must pass that object through unchanged.
  it('preserves a ValidationPipe-style body with a message array', async () => {
    const req = new Readable({ read() { this.push(null); } });
    req.resume();
    await new Promise((resolve) => req.on('end', resolve));

    const res = createResponse();
    const filter = new DrainRequestExceptionFilter();

    const exception = new HttpException(
      {
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );

    await filter.catch(exception, createHost(req, res));

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      statusCode: 400,
      message: ['email must be an email'],
      error: 'Bad Request',
    });
  });
});
