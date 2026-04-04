import { Injectable } from '@nestjs/common';

export const API_VERSION = '1.3.0';

/**
 * Version changelog:
 * 1.0.0 — Initial release
 * 1.1.0 — Added booking, notification, search endpoints
 * 1.2.0 — Added comprehensive Swagger documentation
 * 1.3.0 — Mentor downgrade, availability management, full booking notifications (mentee + mentor + admin)
 */
@Injectable()
export class AppService {
  getVersion(): { version: string; message: string } {
    return {
      version: API_VERSION,
      message: `Gurokonekt API v${API_VERSION}`,
    };
  }
}
