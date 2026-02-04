import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@gurokonekt/models';
import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
