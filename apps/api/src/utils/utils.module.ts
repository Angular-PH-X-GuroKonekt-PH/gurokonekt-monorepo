import { Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { PrismaModule } from '../app/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  exports: [UtilsService],
  providers: [UtilsService],
})
export class UtilsModule {}
