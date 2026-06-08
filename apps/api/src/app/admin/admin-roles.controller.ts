import { Controller, Get, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseStatus } from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AdminRolesService } from './admin-roles.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly rolesService: AdminRolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all admin accounts' })
  async getAdmins() {
    const response = await this.rolesService.getAdmins();
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }
}
