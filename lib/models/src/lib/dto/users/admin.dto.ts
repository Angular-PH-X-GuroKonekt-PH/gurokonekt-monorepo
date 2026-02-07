import { UpdateUserRoleInterface, UpdateUserStatusInterface, UserRole, UserStatus } from "@gurokonekt/models";

export class UpdateUserStatusDto implements UpdateUserStatusInterface {
    updatedById!: string;
    status!: UserStatus;
}

export class UpdateUserRoleDto implements UpdateUserRoleInterface {
    updatedById!: string;
    role!: UserRole;
}