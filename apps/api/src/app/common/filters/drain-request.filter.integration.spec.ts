import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import express from 'express';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';

import { DrainRequestExceptionFilter } from './drain-request.filter';

/**
 * The unit spec (`drain-request.filter.spec.ts`) uses plain mock objects for
 * `req`/`res` — they have no shared socket, so they cannot detect a bug
 * where draining the request accidentally tears down the connection the
 * response is about to be written on. This suite drives a real `express`
 * app (the same runtime Nest's platform-express adapter uses, and already a
 * project dependency — no new package added) over a real socket, so `req`
 * and `res` are the genuine `IncomingMessage`/`ServerResponse` pair sharing
 * one connection, with `res.status()/.json()` actually present. It catches
 * exactly the regression class the unit spec cannot: the client must
 * receive the 401 body, not `ECONNRESET`.
 */
function createIntegrationHost(req: express.Request, res: express.Response): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;
}

const SESSION_EXPIRED_BODY = {
  statusCode: 401,
  message: 'Your session has expired. Please log in again.',
  errorCode: 'SESSION_EXPIRED',
};

function startServer(filter: DrainRequestExceptionFilter): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const app = express();
    app.use((req, res) => {
      const exception = new HttpException(SESSION_EXPIRED_BODY, HttpStatus.UNAUTHORIZED);
      void filter.catch(exception, createIntegrationHost(req, res));
    });
    const server = app.listen(0, '127.0.0.1', () => {
      resolve({ server, port: (server.address() as AddressInfo).port });
    });
  });
}

function stopServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    // The client in these tests may still be mid-upload (drip-feeding a
    // body larger than the cap) when its response already arrived; that
    // leaves an idle-but-open keep-alive socket that a graceful close()
    // would otherwise wait on indefinitely. Force it closed instead.
    server.closeAllConnections();
    server.close(() => resolve());
  });
}

/**
 * Streams `totalBytes` to the server in `chunkSize` pieces with a delay
 * between writes, so the body is still in flight on the wire when a small
 * `maxDrainBytes` cap trips server-side.
 */
function postDripFedBody(
  port: number,
  totalBytes: number,
  chunkSize: number,
  delayMs: number,
): Promise<{ status: number | undefined; body: string }> {
  return new Promise((resolve, reject) => {
    let finished = false;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/user/00000000-0000-0000-0000-000000000000/profile',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/octet-stream' },
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          finished = true;
          resolve({ status: res.statusCode, body });
        });
      },
    );

    req.on('error', (err) => {
      if (!finished) reject(err);
    });

    const chunk = Buffer.alloc(chunkSize, 'a');
    let sent = 0;

    // Stop drip-feeding as soon as the response has arrived — the cap path
    // responds while the client is still mid-upload by design, so once
    // we've observed the 401 there is nothing left to prove by continuing
    // to write to a socket the server has already answered on.
    const sendNext = () => {
      if (finished || sent >= totalBytes) {
        if (!finished) req.end();
        return;
      }
      sent += chunkSize;
      req.write(chunk, () => {
        if (!finished) setTimeout(sendNext, delayMs);
      });
    };

    sendNext();
  });
}

describe('DrainRequestExceptionFilter (integration, real socket)', () => {
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let server: http.Server | undefined;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    if (server) {
      await stopServer(server);
      server = undefined;
    }
  });

  it(
    'delivers the 401 to the client when the byte cap trips mid-upload',
    async () => {
      const filter = new DrainRequestExceptionFilter({ maxDrainBytes: 8 * 1024, drainTimeoutMs: 5000 });
      const started = await startServer(filter);
      server = started.server;

      // 1 MB total, sent 16 KB at a time with a pause between writes — far
      // more than the 8 KB cap, and slow enough that the body is still
      // arriving when the filter decides to stop draining and respond.
      const { status, body } = await postDripFedBody(started.port, 1024 * 1024, 16 * 1024, 15);

      expect(status).toBe(401);
      expect(JSON.parse(body)).toEqual(SESSION_EXPIRED_BODY);
    },
    15000,
  );

  it(
    'delivers the 401 when the body finishes normally before any cap',
    async () => {
      const filter = new DrainRequestExceptionFilter();
      const started = await startServer(filter);
      server = started.server;

      const { status, body } = await postDripFedBody(started.port, 4 * 1024, 1024, 0);

      expect(status).toBe(401);
      expect(JSON.parse(body)).toEqual(SESSION_EXPIRED_BODY);
    },
    15000,
  );
});
