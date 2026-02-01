import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UtilsModule } from '../../utils/utils.module';

@Module({
  imports: [PrismaModule, UtilsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
