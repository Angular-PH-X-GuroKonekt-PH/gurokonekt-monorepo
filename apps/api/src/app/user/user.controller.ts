import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Patch,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import {
  AvatarInterceptor,
  MentorDocumentsInterceptor,
  ResponseDto,
  SWAGGER_DOCUMENTATION,
  UpdateMenteeProfileDto,
  UpdateMentorProfileDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from '@gurokonekt/models';
import { UserService } from './user.service';

@ApiTags('User Management')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // ====================================================
  // GET
  // ====================================================

  @Get(':userId/profile')
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'Unique ID of the user',
    example: 'uuid-user-id',
  })
  @ApiResponse({
    status: 200,
    description: 'User get successfully',
    type: ResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserProfileById(
    @Param('userId') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.userService.getUserProfileById(
      userId,
      ipAddress,
      userAgent,
    );
  }

  // ====================================================
  // GET - Unified Dashboard (role-based)
  // ====================================================

  @Get(':userId/dashboard')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Dashboard data — automatically returns Mentor or Mentee dashboard based on the authenticated user role',
  })
  @ApiParam({ name: 'userId', type: String, description: 'Unique ID of the user' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDashboard(
    @Param('userId') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.userService.getUserDashboard(userId, ipAddress, userAgent);
  }

  // ====================================================
  // GET - Mentee Booking Overview
  // ====================================================

  @Get(':userId/booking-overview')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Mentee booking summary (total, upcoming, completed, pending)' })
  @ApiParam({ name: 'userId', type: String, description: 'Unique ID of the mentee' })
  @ApiResponse({ status: 200, description: 'Booking overview retrieved successfully', type: ResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMenteeBookingOverview(
    @Param('userId') userId: string,
  ) {
    return this.userService.getMenteeBookingOverview(userId);
  }

  // ====================================================
  // PATCH - Update User Profile
  // ====================================================

  @Patch(':userId/profile')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.UPDATE_USER_PROFILE.summary,
    description: SWAGGER_DOCUMENTATION.UPDATE_USER_PROFILE.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'Unique ID of the user',
    example: 'uuid-user-id',
  })
  @ApiBody({
    description: 'Profile data + optional avatar file',
    type: UpdateMenteeProfileDto, 
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: ResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @UseInterceptors(AvatarInterceptor, MentorDocumentsInterceptor)
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateMenteeProfileDto | UpdateMentorProfileDto,
    @UploadedFiles() avatar: Express.Multer.File[],
    @UploadedFiles() files: Express.Multer.File[],
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.userService.updateUserProfile(
      userId,
      dto,
      avatar,
      files,
      ipAddress,
      userAgent,
    );
  }

  // ====================================================
  // PATCH - Update User Status
  // ====================================================

  @Patch(':userId/status')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.UPDATE_USER_STATUS.summary,
    description: SWAGGER_DOCUMENTATION.UPDATE_USER_STATUS.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'Unique ID of the user',
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    type: ResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  updateUserStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserStatus(dto, userId);
  }

  // ====================================================
  // PATCH - Update User Role
  // ====================================================

  @Patch(':userId/role')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.UPDATE_USER_ROLE.summary,
    description: SWAGGER_DOCUMENTATION.UPDATE_USER_ROLE.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'Unique ID of the user',
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    type: ResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  updateUserRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.userService.updateUserRole(dto, userId);
  }
}
