import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto, UpdateUserStatusDto } from '@gurokonekt/models';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('users/:userId/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'userId', type: String })
  updateUserStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(dto, userId);
  }

  @Patch('users/:userId/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'userId', type: String })
  updateUserRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(dto, userId);
  }
}
