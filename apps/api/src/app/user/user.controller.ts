import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdateUserRoleDto, UpdateUserStatusDto } from '@gurokonekt/models';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
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
