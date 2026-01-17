import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MentorService } from './mentor.service';
import { UpdateMentorProfileDto } from '../../dto/user/mentor';

@ApiTags('Mentor')
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current authenticated mentor profile' })
  getProfile() {
    // TODO: Replace with actual authenticated user ID from AuthGuard
    const currentUserId = 'CURRENT_USER_ID_FROM_GUARD';
    return this.mentorService.getMyMentorProfile(currentUserId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current authenticated mentor profile' })
  updateProfile(@Body() dto: UpdateMentorProfileDto) {
    const currentUserId = 'CURRENT_USER_ID_FROM_GUARD';
    return this.mentorService.updateMentorProfile(
      currentUserId, // mentorUserId
      dto,
      currentUserId, // currentUserId
    );
  }

  @Delete('account')
  @ApiOperation({ summary: 'Soft-delete current authenticated mentor account' })
  deleteAccount() {
    const currentUserId = 'CURRENT_USER_ID_FROM_GUARD';
    return this.mentorService.deleteMentorAccount(
      currentUserId, // mentorId
      currentUserId, // currentUserId
    );
  }
}
