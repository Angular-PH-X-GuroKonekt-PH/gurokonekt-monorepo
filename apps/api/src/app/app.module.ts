import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [UsersModule, AuthenticationModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
