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
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AddAvailabilitySlotDto,
  DeactivationFeedbackDto,
  DeleteAvailabilitySlotDto,
  DowngradeMentorDto,
  InitiateDeactivationDto,
  ManageAvailabilityDto,
  ResponseDto,
  SWAGGER_DOCUMENTATION,
  UpdateMenteeProfileDto,
  UpdateMentorProfileDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  VerifyDeactivationTokenDto,
} from '@gurokonekt/models';
import { Request } from 'express';
import { UserService } from './user.service';

@ApiTags('User Management')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ====================================================
  // POST - Deactivate Verify (public — no JWT; declared BEFORE :userId routes)
  // ====================================================

  @Post('deactivate/verify')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.VERIFY_DEACTIVATION_TOKEN.summary,
    description: SWAGGER_DOCUMENTATION.VERIFY_DEACTIVATION_TOKEN.description,
  })
  @ApiBody({
    type: VerifyDeactivationTokenDto,
    examples: {
      default: { summary: 'Validate deactivation token from email link', value: SWAGGER_DOCUMENTATION.VERIFY_DEACTIVATION_TOKEN.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid. Proceed to POST /user/:userId/deactivate/feedback.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Deactivation token is valid',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Token is invalid or has expired.' })
  verifyDeactivationToken(@Body() dto: VerifyDeactivationTokenDto) {
    return this.userService.verifyDeactivationToken(dto);
  }

  // ====================================================
  // GET - User Profile
  // ====================================================

  @Get(':userId/profile')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.GET_USER_PROFILE.summary,
    description: SWAGGER_DOCUMENTATION.GET_USER_PROFILE.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the user',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'User profile get successfully',
        data: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          firstName: 'Jane',
          lastName: 'Dela Cruz',
          email: 'jane.delacruz@example.com',
          role: 'mentee',
          status: 'active',
          isProfileComplete: true,
          menteeProfile: {
            bio: 'Aspiring backend engineer.',
            learningGoals: ['System Design', 'Node.js'],
            areasOfInterest: ['Backend', 'Cloud'],
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
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
    summary: SWAGGER_DOCUMENTATION.GET_USER_DASHBOARD.summary,
    description: SWAGGER_DOCUMENTATION.GET_USER_DASHBOARD.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the authenticated user (must match JWT)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully. Shape varies by role.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Mentee dashboard data retrieved successfully',
        data: {
          upcomingSessions: [],
          bookingHistory: [],
          totalSessions: 0,
          pendingRequests: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — mentor account not approved/complete, or user is not a mentee.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
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
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.GET_BOOKING_OVERVIEW.summary,
    description: SWAGGER_DOCUMENTATION.GET_BOOKING_OVERVIEW.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the mentee',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking overview retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Mentee booking overview retrieved successfully',
        data: {
          total: 8,
          upcoming: 2,
          completed: 5,
          pending: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — user is not a mentee.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
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
    description: 'UUID of the user',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    description: 'Profile data + optional avatar file. Fields depend on user role (see endpoint description).',
    type: UpdateMenteeProfileDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully. isProfileComplete is set to true.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'User profile updated successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error or unsupported file type.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error (file upload or database failure).' })
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
    description: 'UUID of the user to update',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: UpdateUserStatusDto,
    examples: {
      approve: { summary: 'Approve a mentor', value: SWAGGER_DOCUMENTATION.UPDATE_USER_STATUS.bodyExample },
      suspend: { summary: 'Suspend a user', value: { status: 'suspended', updatedById: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'User status updated successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error or invalid status value.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
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
    description: 'UUID of the user to update',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: UpdateUserRoleDto,
    examples: {
      default: { summary: 'Promote to mentor', value: SWAGGER_DOCUMENTATION.UPDATE_USER_ROLE.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'User role updated successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error or invalid role value.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
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
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.INITIATE_DEACTIVATION.summary,
    description: SWAGGER_DOCUMENTATION.INITIATE_DEACTIVATION.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the mentee',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: InitiateDeactivationDto,
    examples: {
      default: { summary: 'Initiate deactivation with password', value: SWAGGER_DOCUMENTATION.INITIATE_DEACTIVATION.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Deactivation confirmation email sent. User must click the link in the email to continue.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Deactivation confirmation email sent',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Password is incorrect.' })
  @ApiResponse({ status: 403, description: 'Access denied — account is not a mentee.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
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
  // POST - Mentor Downgrade to Mentee
  // ====================================================

  @Post(':userId/downgrade')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.DOWNGRADE_MENTOR.summary,
    description: SWAGGER_DOCUMENTATION.DOWNGRADE_MENTOR.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the mentor to downgrade',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: DowngradeMentorDto,
    examples: {
      default: { summary: 'Confirm downgrade with password', value: SWAGGER_DOCUMENTATION.DOWNGRADE_MENTOR.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Account downgraded to Mentee. Status set to inactive. Confirmation email sent.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Account successfully downgraded to Mentee access',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Password is incorrect.' })
  @ApiResponse({ status: 403, description: 'Access denied — account is not a Mentor.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  downgradeMentorToMentee(
    @Param('userId') userId: string,
    @Body() dto: DowngradeMentorDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Headers('origin') origin: string,
  ) {
    return this.userService.downgradeMentorToMentee(userId, dto, ipAddress, userAgent, origin ?? '');
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
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the mentor',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability schedule retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Availability retrieved successfully',
        data: [
          { day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }] },
          { day: 'wednesday', timeFrames: [{ from: '10:00', to: '13:00' }] },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — you can only view your own availability.' })
  getMentorAvailability(
    @Param('userId') userId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.getMentorAvailability(userId, req.user.id);
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
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the mentor',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: ManageAvailabilityDto,
    examples: {
      default: { summary: 'Set weekly schedule', value: SWAGGER_DOCUMENTATION.UPDATE_AVAILABILITY.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Full availability schedule replaced successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Availability updated successfully',
        data: [{ day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }] }],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Overlapping or invalid time ranges.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — mentor not approved or not a mentor.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  updateMentorAvailability(
    @Param('userId') userId: string,
    @Body() dto: ManageAvailabilityDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.updateMentorAvailability(userId, dto, req.user.id);
  }

  // ====================================================
  // POST - Add / Replace Availability Slot for a Day
  // ====================================================

  @Post(':userId/availability/slot')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.ADD_AVAILABILITY_SLOT.summary,
    description: SWAGGER_DOCUMENTATION.ADD_AVAILABILITY_SLOT.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the mentor',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: AddAvailabilitySlotDto,
    examples: {
      default: { summary: 'Add Tuesday slots', value: SWAGGER_DOCUMENTATION.ADD_AVAILABILITY_SLOT.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Slot added/replaced successfully. Returns the full updated schedule.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Availability slot added successfully',
        data: [{ day: 'tuesday', timeFrames: [{ from: '08:00', to: '10:00' }] }],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Overlapping or invalid time ranges.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — mentor not approved or not a mentor.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  addAvailabilitySlot(
    @Param('userId') userId: string,
    @Body() dto: AddAvailabilitySlotDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.addAvailabilitySlot(userId, dto, req.user.id);
  }

  // ====================================================
  // DELETE - Remove Availability Slot for a Day
  // ====================================================

  @Delete(':userId/availability/slot')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.DELETE_AVAILABILITY_SLOT.summary,
    description: SWAGGER_DOCUMENTATION.DELETE_AVAILABILITY_SLOT.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the mentor',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: DeleteAvailabilitySlotDto,
    examples: {
      deleteDay: { summary: 'Delete all slots for a day', value: SWAGGER_DOCUMENTATION.DELETE_AVAILABILITY_SLOT.bodyExample },
      deleteSlot: { summary: 'Delete a specific time frame', value: { day: 'monday', timeFrameIndex: 0 } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Slot deleted successfully. Returns the updated schedule.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Availability slot deleted successfully',
        data: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — mentor not approved or not a mentor.' })
  @ApiResponse({ status: 404, description: 'Slot not found for specified day / time frame index.' })
  deleteAvailabilitySlot(
    @Param('userId') userId: string,
    @Body() dto: DeleteAvailabilitySlotDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.deleteAvailabilitySlot(userId, dto, req.user.id);
  }

  // ====================================================
  // POST - Submit Deactivation Feedback
  // ====================================================

  @Post(':userId/deactivate/feedback')
  @UseGuards(JwtGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.DEACTIVATION_FEEDBACK.summary,
    description: SWAGGER_DOCUMENTATION.DEACTIVATION_FEEDBACK.description,
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the mentee',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: DeactivationFeedbackDto,
    examples: {
      default: { summary: 'Submit feedback and finalise deactivation', value: SWAGGER_DOCUMENTATION.DEACTIVATION_FEEDBACK.bodyExample },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Account deactivated successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Deactivation token is invalid or has expired.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  submitDeactivationFeedback(
    @Param('userId') userId: string,
    @Body() dto: DeactivationFeedbackDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.userService.submitDeactivationFeedback(userId, dto, ipAddress, userAgent);
  }
}
