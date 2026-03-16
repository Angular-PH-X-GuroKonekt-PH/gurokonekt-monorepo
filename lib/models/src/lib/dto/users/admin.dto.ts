import { UpdateUserRoleInterface, UpdateUserStatusInterface } from '../../interfaces/user/admin.model';
import { UserRole, UserStatus } from '../../interfaces/user/user.model';

export class UpdateUserStatusDto implements UpdateUserStatusInterface {
    updatedById!: string;
    status!: UserStatus;
}

export class UpdateUserRoleDto implements UpdateUserRoleInterface {
    updatedById!: string;
    role!: UserRole;
}