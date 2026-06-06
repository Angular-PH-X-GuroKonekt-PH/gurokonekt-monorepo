const LOCALHOST_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4200',
  'http://localhost:4201',
];

const GUROKONEKT_ORIGIN_REGEX = /^https:\/\/([a-z0-9-]+\.)?gurokonekt\.com$/;

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  return LOCALHOST_ORIGINS.includes(origin) || GUROKONEKT_ORIGIN_REGEX.test(origin);
}

export const ALLOWED_CORS_ORIGINS = LOCALHOST_ORIGINS;
