import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [PrismaModule, JwtGuardModule, PassportModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
