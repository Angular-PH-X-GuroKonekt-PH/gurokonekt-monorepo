import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  CreateUserDto,
  CreateMenteeProfileDto,
  CreateMentorProfileDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from '../../dto/user/admin';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  createUser(@Body() dto: CreateUserDto) {
    // TODO: replace with actual admin ID from AuthGuard
    const adminId = 'ADMIN_ID_FROM_GUARD';
    return this.adminService.createUser(adminId, dto);
  }

  @Post('users/:userId/mentee-profile')
  @ApiOperation({ summary: 'Create mentee profile for a user' })
  @ApiParam({ name: 'userId', type: String })
  createMenteeProfile(
    @Param('userId') userId: string,
    @Body() dto: CreateMenteeProfileDto,
  ) {
    return this.adminService.createMenteeProfile(userId, dto);
  }

  @Post('users/:userId/mentor-profile')
  @ApiOperation({ summary: 'Create mentor profile for a user' })
  @ApiParam({ name: 'userId', type: String })
  createMentorProfile(
    @Param('userId') userId: string,
    @Body() dto: CreateMentorProfileDto,
  ) {
    return this.adminService.createMentorProfile(userId, dto);
  }

  @Patch('users/:userId/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'userId', type: String })
  updateUserStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const adminId = 'ADMIN_ID_FROM_GUARD';
    return this.adminService.updateUserStatus(adminId, userId, { status: dto.status });
  }

  @Patch('users/:userId/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'userId', type: String })
  updateUserRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const adminId = 'ADMIN_ID_FROM_GUARD';
    return this.adminService.updateUserRole(adminId, userId, { role: dto.role });
  }
}
