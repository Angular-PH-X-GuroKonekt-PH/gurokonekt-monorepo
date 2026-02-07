import {
  Controller
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MentorService } from './mentor.service';

@ApiTags('Mentor')
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

}
