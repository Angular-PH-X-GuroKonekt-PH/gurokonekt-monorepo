import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MenteeService } from './mentee.service';
import { UpdateMenteeProfileDto } from '../../dto/user/mentee';

@ApiTags('Mentee')
@Controller('mentee')
export class MenteeController {
  constructor(private readonly menteeService: MenteeService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current authenticated mentee profile' })
  getProfile() {
    // TODO: Replace with current authenticated user ID from AuthGuard
    const currentUserId = 'CURRENT_USER_ID_FROM_GUARD';
    return this.menteeService.getProfile(currentUserId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current authenticated mentee profile' })
  updateProfile(@Body() dto: UpdateMenteeProfileDto) {
    const currentUserId = 'CURRENT_USER_ID_FROM_GUARD';
    return this.menteeService.updateProfile(currentUserId, dto);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Soft-delete current authenticated mentee account' })
  deleteAccount() {
    const currentUserId = 'CURRENT_USER_ID_FROM_GUARD';
    return this.menteeService.deleteAccount(currentUserId, currentUserId);
  }
}
