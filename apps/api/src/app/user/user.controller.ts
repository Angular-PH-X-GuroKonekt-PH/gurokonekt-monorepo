import { Body, Controller, Headers, Ip, Param, Patch, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AvatarInterceptor, ResponseDto, UpdateMenteeProfileDto, UpdateMentorProfileDto, UpdateUserRoleDto, UpdateUserStatusDto } from '@gurokonekt/models';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ====================================================
  // GET
  // ====================================================

  // ====================================================
  // POST
  // ====================================================

  // ====================================================
  // PATCH
  // ====================================================
  
  @Patch('users/:userId/profile')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create or update user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully', type: ResponseDto })
  @UseInterceptors(AvatarInterceptor)
  async registerMentor(
    @Param('userId') userId: string,
    @Body() dto: UpdateMenteeProfileDto | UpdateMentorProfileDto, 
    @UploadedFiles() avatar: Express.Multer.File[],
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.userService.updateUserProfile(userId, dto, avatar, ipAddress, userAgent);
  }

  @Patch('users/:userId/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'userId', type: String })
  updateUserStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserStatus(dto, userId);
  }

  @Patch('users/:userId/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'userId', type: String })
  updateUserRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.userService.updateUserRole(dto, userId);
  }
}
