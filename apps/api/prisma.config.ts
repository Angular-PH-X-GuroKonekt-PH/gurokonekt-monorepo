import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env('TEST_PRISMA_DIRECT_URL'),
  },
});



