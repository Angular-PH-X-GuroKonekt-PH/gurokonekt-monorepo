import { Module } from '@nestjs/common';
import { MenteeService } from './mentee.service';
import { MenteeController } from './mentee.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MenteeController],
  providers: [MenteeService],
})
export class MenteeModule {}
