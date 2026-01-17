import { Module } from '@nestjs/common';
import { MenteeService } from './mentee.service';
import { MenteeController } from './mentee.controller';

@Module({
  controllers: [MenteeController],
  providers: [MenteeService],
})
export class MenteeModule {}
