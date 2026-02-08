import {
  Controller
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MenteeService } from './mentee.service';

@ApiTags('Mentee')
@Controller('mentee')
export class MenteeController {
  constructor(private readonly menteeService: MenteeService) {}

}
