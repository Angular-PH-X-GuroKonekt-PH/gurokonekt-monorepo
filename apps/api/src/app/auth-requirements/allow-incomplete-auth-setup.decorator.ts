import { SetMetadata } from '@nestjs/common';

export const ALLOW_INCOMPLETE_AUTH_SETUP = 'allowIncompleteAuthSetup';

/**
 * Lets a JWT-protected route run for accounts that are still missing a
 * required sign-in method: only the routes needed to finish that setup.
 */
export const AllowIncompleteAuthSetup = () => SetMetadata(ALLOW_INCOMPLETE_AUTH_SETUP, true);
