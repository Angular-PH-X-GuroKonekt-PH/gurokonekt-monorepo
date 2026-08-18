import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Nest's default filter writes the error response the moment a guard throws.
 * On a multipart upload that is still in flight, the client is mid-body when
 * the connection is torn down — Chrome discards the response entirely and
 * the XHR surfaces as `status 0`, so a perfectly good 401 never reaches the
 * app and the token-refresh path can never run.
 *
 * Reading (and discarding) whatever is left of the request before responding
 * costs nothing on ordinary JSON routes and turns those dropped uploads back
 * into real, readable HTTP errors.
 *
 * The drain is bounded — an unauthenticated caller must not be able to make
 * the API sit and swallow an unbounded stream.
 */
const DEFAULT_MAX_DRAIN_BYTES = 8 * 1024 * 1024; // just over the 5 MB Multer limit
const DEFAULT_DRAIN_TIMEOUT_MS = 10_000;

export interface DrainRequestFilterOptions {
  maxDrainBytes?: number;
  drainTimeoutMs?: number;
}

@Catch()
export class DrainRequestExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DrainRequestExceptionFilter.name);
  private readonly maxDrainBytes: number;
  private readonly drainTimeoutMs: number;

  constructor(options: DrainRequestFilterOptions = {}) {
    this.maxDrainBytes = options.maxDrainBytes ?? DEFAULT_MAX_DRAIN_BYTES;
    this.drainTimeoutMs = options.drainTimeoutMs ?? DEFAULT_DRAIN_TIMEOUT_MS;
  }

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.buildBody(exception, status);

    if (!(exception instanceof HttpException)) {
      const err = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(`Unhandled exception: ${err.message}`, err.stack);
    }

    await this.drain(req);

    if (res.headersSent) {
      return;
    }

    res.status(status).json(body);
  }

  private buildBody(exception: unknown, status: number): Record<string, unknown> {
    if (!(exception instanceof HttpException)) {
      return { statusCode: status, message: 'Internal server error' };
    }

    const response = exception.getResponse();
    return typeof response === 'string'
      ? { statusCode: status, message: response }
      : (response as Record<string, unknown>);
  }

  /**
   * Resolves once the request body has been fully received, the byte cap is
   * hit, or the timeout fires — whichever comes first.
   */
  private drain(req: Request): Promise<void> {
    const stream = req as unknown as NodeJS.ReadableStream & {
      readableEnded?: boolean;
      complete?: boolean;
      readable?: boolean;
      pause?: () => void;
    };

    if (stream.readableEnded || stream.complete || stream.readable === false) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      let settled = false;
      let drained = 0;

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        stream.removeListener('data', onData);
        stream.removeListener('end', finish);
        stream.removeListener('error', finish);
        stream.removeListener('aborted', finish);
        stream.removeListener('close', finish);
        // Once we stop listening, an unfinished stream left in flowing mode
        // keeps calling its internal _read() in a tight loop with nothing to
        // consume the output — that pins the event loop indefinitely on a
        // slow/malicious upload. Pausing it breaks that loop.
        //
        // Deliberately NOT destroy(): on a real `http.IncomingMessage` that
        // hasn't fully ended, _destroy() tears down the underlying socket —
        // the same socket `res` is about to write the error response on.
        // That would silently reintroduce the exact #395 symptom (dropped
        // connection, no delivered 401) for the oversized/slow-upload case
        // this cap exists to handle. pause() only stops the read loop; it
        // never touches the socket, so the response can still be written.
        stream.pause?.();
        resolve();
      };

      const onData = (chunk: Buffer | string) => {
        drained += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
        if (drained > this.maxDrainBytes) {
          this.logger.warn(
            `Drain cap of ${this.maxDrainBytes} bytes exceeded on ${req.method} ${req.url}; responding early`,
          );
          finish();
        }
      };

      const timer = setTimeout(() => {
        this.logger.warn(`Drain timed out after ${this.drainTimeoutMs}ms on ${req.method} ${req.url}`);
        finish();
      }, this.drainTimeoutMs);

      stream.on('data', onData);
      stream.on('end', finish);
      stream.on('error', finish);
      stream.on('aborted', finish);
      stream.on('close', finish);
    });
  }
}
