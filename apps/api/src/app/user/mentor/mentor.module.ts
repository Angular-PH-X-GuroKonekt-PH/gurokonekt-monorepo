import { Module } from '@nestjs/common';
import { MentorService } from './mentor.service';
import { MentorController } from './mentor.controller';

@Module({
  controllers: [MentorController],
  providers: [MentorService],
})
export class MentorModule {}
