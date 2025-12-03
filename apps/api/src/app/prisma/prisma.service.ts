import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit {
  private client: PrismaClient;

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    this.client = new PrismaClient({ adapter });
  }

  get db() {
    return this.client;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    (this.client as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}
