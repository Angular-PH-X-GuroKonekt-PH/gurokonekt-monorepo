import { ErrorHandler, Injectable } from '@angular/core';

import { recoverFromStaleChunk } from '../../shared/utils/stale-chunk.util';

@Injectable()
export class StaleChunkErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (recoverFromStaleChunk(error)) {
      return;
    }

    console.error(error);
  }
}
