import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  Ip,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
  AddAvailabilitySlotDto,
  DeactivationFeedbackDto,
  DeleteAvailabilitySlotDto,
  DowngradeMentorDto,
  InitiateDeactivationDto,
  ManageAvailabilityDto,
  ResponseDto,
  SetSessionDurationDto,
  SWAGGER_DOCUMENTATION,
  UpdateMenteeProfileDto,
  UpdateMentorProfileDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  VerifyDeactivationTokenDto,
} from '@gurokonekt/models';
import { UserService } from './user.service';

@ApiTags('User Management')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // ====================================================
  // POST - Deactivate Verify (public — no JWT; declared BEFORE :userId routes)
  // ====================================================

  @Post('deactivate/verify')
  @ApiOperation({ summary: 'Verify deactivation token from email link (public)' })
  @ApiResponse({ status: 200, description: 'Token is valid', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  verifyDeactivationToken(@Body() dto: VerifyDeactivationTokenDto) {
    return this.userService.verifyDeactivationToken(dto);
  }

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
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 },
    { name: 'files', maxCount: 5 },
  ], {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const avatarTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const docTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      const allowed = file.fieldname === 'avatar' ? avatarTypes : docTypes;
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type for field ${file.fieldname}`), false);
      }
      cb(null, true);
    },
  }))
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateMenteeProfileDto | UpdateMentorProfileDto,
    @UploadedFiles() uploadedFiles: { avatar?: Express.Multer.File[], files?: Express.Multer.File[] },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const result = await this.userService.updateUserProfile(
      userId,
      dto,
      uploadedFiles?.avatar,
      uploadedFiles?.files,
      ipAddress,
      userAgent,
    );

    if (result.status === 'error') {
      throw new HttpException(result.message, result.statusCode || 400);
    }

    return result;
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

  // ====================================================
  // POST - Initiate Account Deactivation
  // ====================================================

  @Post(':userId/deactivate/initiate')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate mentee account deactivation — verifies password and sends confirmation email' })
  @ApiParam({ name: 'userId', type: String, description: 'Unique ID of the mentee' })
  @ApiResponse({ status: 200, description: 'Deactivation email sent', type: ResponseDto })
  @ApiResponse({ status: 401, description: 'Password incorrect' })
  @ApiResponse({ status: 403, description: 'Access denied: not a mentee account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  initiateDeactivation(
    @Param('userId') userId: string,
    @Body() dto: InitiateDeactivationDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('origin') origin: string,
  ) {
    return this.userService.initiateDeactivation(userId, dto, ipAddress, userAgent, origin ?? '');
  }

  // ====================================================
  // POST - Submit Deactivation Feedback
  // ====================================================

  @Post(':userId/deactivate/feedback')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit deactivation feedback and finalize account deactivation' })
  @ApiParam({ name: 'userId', type: String, description: 'Unique ID of the mentee' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired deactivation token' })
  submitDeactivationFeedback(
    @Param('userId') userId: string,
    @Body() dto: DeactivationFeedbackDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.userService.submitDeactivationFeedback(userId, dto, ipAddress, userAgent);
  }

  // ====================================================
  // POST - Downgrade Mentor to Mentee
  // ====================================================

  @Post(':userId/downgrade')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.DOWNGRADE_MENTOR.summary,
    description: SWAGGER_DOCUMENTATION.DOWNGRADE_MENTOR.description,
  })
  @ApiParam({ name: 'userId', type: String, description: 'UUID of the mentor account to downgrade', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: DowngradeMentorDto, examples: { default: { value: SWAGGER_DOCUMENTATION.DOWNGRADE_MENTOR.bodyExample } } })
  @ApiResponse({ status: 200, description: 'Mentor account downgraded to mentee successfully', type: ResponseDto })
  @ApiResponse({ status: 401, description: 'Password incorrect' })
  @ApiResponse({ status: 403, description: 'Account is not a mentor' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  downgradeMentor(
    @Param('userId') userId: string,
    @Body() dto: DowngradeMentorDto,
    @Req() req: Request,
  ) {
    const requesterId = (req as Request & { user?: { sub?: string } }).user?.sub ?? userId;
    return this.userService.downgradeMentorToMentee(userId, requesterId, dto);
  }

  // ====================================================
  // PATCH - Set Session Duration
  // ====================================================

  @Patch(':userId/availability/duration')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.SET_SESSION_DURATION.summary,
    description: SWAGGER_DOCUMENTATION.SET_SESSION_DURATION.description,
  })
  @ApiParam({ name: 'userId', type: String, description: 'UUID of the mentor', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: SetSessionDurationDto, examples: { default: { value: SWAGGER_DOCUMENTATION.SET_SESSION_DURATION.bodyExample } } })
  @ApiResponse({
    status: 200,
    description: 'Session duration updated successfully',
    schema: { example: { status: 'success', statusCode: 200, message: 'Session duration updated successfully', data: { sessionDurationMinutes: 60 } } },
  })
  @ApiResponse({ status: 400, description: 'sessionDurationMinutes must be at least 15' })
  @ApiResponse({ status: 403, description: 'Access denied — not an approved mentor' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  setSessionDuration(
    @Param('userId') userId: string,
    @Body() dto: SetSessionDurationDto,
    @Req() req: Request,
  ) {
    const requesterId = (req as Request & { user?: { sub?: string } }).user?.sub ?? userId;
    return this.userService.setSessionDuration(userId, requesterId, dto);
  }

  // ====================================================
  // GET - Mentor Availability
  // ====================================================

  @Get(':userId/availability')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.GET_AVAILABILITY.summary,
    description: SWAGGER_DOCUMENTATION.GET_AVAILABILITY.description,
  })
  @ApiParam({ name: 'userId', type: String, description: 'UUID of the mentor', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({
    status: 200,
    description: 'Availability schedule and session duration retrieved successfully',
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Availability schedule retrieved successfully',
        data: {
          sessionDurationMinutes: 60,
          availability: [
            { day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }] },
            { day: 'wednesday', timeFrames: [{ from: '10:00', to: '13:00' }] },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getMentorAvailability(@Param('userId') userId: string) {
    return this.userService.getMentorAvailability(userId);
  }

  // ====================================================
  // PUT - Replace Full Availability Schedule
  // ====================================================

  @Put(':userId/availability')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.UPDATE_AVAILABILITY.summary,
    description: SWAGGER_DOCUMENTATION.UPDATE_AVAILABILITY.description,
  })
  @ApiParam({ name: 'userId', type: String, description: 'UUID of the mentor', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: ManageAvailabilityDto, examples: { default: { value: SWAGGER_DOCUMENTATION.UPDATE_AVAILABILITY.bodyExample } } })
  @ApiResponse({
    status: 200,
    description: 'Availability schedule updated successfully',
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Availability schedule updated successfully',
        data: {
          sessionDurationMinutes: 60,
          availability: [
            { day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }] },
            { day: 'wednesday', timeFrames: [{ from: '10:00', to: '13:00' }] },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid time range | overlapping frames | duplicate day | frame shorter than sessionDurationMinutes' })
  @ApiResponse({ status: 403, description: 'Access denied — not an approved mentor' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  updateAvailability(
    @Param('userId') userId: string,
    @Body() dto: ManageAvailabilityDto,
    @Req() req: Request,
  ) {
    const requesterId = (req as Request & { user?: { sub?: string } }).user?.sub ?? userId;
    return this.userService.updateMentorAvailability(userId, requesterId, dto);
  }

  // ====================================================
  // POST - Add / Replace a Single Day Slot
  // ====================================================

  @Post(':userId/availability/slot')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.ADD_AVAILABILITY_SLOT.summary,
    description: SWAGGER_DOCUMENTATION.ADD_AVAILABILITY_SLOT.description,
  })
  @ApiParam({ name: 'userId', type: String, description: 'UUID of the mentor', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: AddAvailabilitySlotDto, examples: { default: { value: SWAGGER_DOCUMENTATION.ADD_AVAILABILITY_SLOT.bodyExample } } })
  @ApiResponse({
    status: 200,
    description: 'Time frames appended to the day successfully',
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Availability slot added successfully',
        data: {
          sessionDurationMinutes: 60,
          availability: [
            { day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }] },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid time range | new frames overlap existing frames | frame shorter than sessionDurationMinutes' })
  @ApiResponse({ status: 403, description: 'Access denied — not an approved mentor' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  addAvailabilitySlot(
    @Param('userId') userId: string,
    @Body() dto: AddAvailabilitySlotDto,
    @Req() req: Request,
  ) {
    const requesterId = (req as Request & { user?: { sub?: string } }).user?.sub ?? userId;
    return this.userService.addAvailabilitySlot(userId, requesterId, dto);
  }

  // ====================================================
  // DELETE - Remove a Day or Specific Time Frame
  // ====================================================

  @Delete(':userId/availability/slot')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.DELETE_AVAILABILITY_SLOT.summary,
    description: SWAGGER_DOCUMENTATION.DELETE_AVAILABILITY_SLOT.description,
  })
  @ApiParam({ name: 'userId', type: String, description: 'UUID of the mentor', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: DeleteAvailabilitySlotDto, examples: { default: { value: SWAGGER_DOCUMENTATION.DELETE_AVAILABILITY_SLOT.bodyExample } } })
  @ApiResponse({
    status: 200,
    description: 'Availability slot deleted successfully',
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Availability slot deleted successfully',
        data: {
          sessionDurationMinutes: 60,
          availability: [
            { day: 'monday', timeFrames: [{ from: '14:00', to: '17:00' }] },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Access denied — not an approved mentor' })
  @ApiResponse({ status: 404, description: 'Day not found in availability schedule' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  deleteAvailabilitySlot(
    @Param('userId') userId: string,
    @Body() dto: DeleteAvailabilitySlotDto,
    @Req() req: Request,
  ) {
    const requesterId = (req as Request & { user?: { sub?: string } }).user?.sub ?? userId;
    return this.userService.deleteAvailabilitySlot(userId, requesterId, dto);
  }
}
