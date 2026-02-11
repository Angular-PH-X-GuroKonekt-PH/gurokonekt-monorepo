import {
  Body,
  Controller,
  Headers,
  Ip,
  Param,
  Patch,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import {
  AvatarInterceptor,
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
  // PATCH - Create or Update User Profile
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
  @UseInterceptors(AvatarInterceptor)
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateMenteeProfileDto | UpdateMentorProfileDto,
    @UploadedFiles() avatar: Express.Multer.File[],
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.userService.updateUserProfile(
      userId,
      dto,
      avatar,
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
