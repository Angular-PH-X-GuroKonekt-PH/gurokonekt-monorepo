import { UserRole, UserStatus } from "./user.model";

export interface UpdateUserStatusInterface {
    updatedById: string;
    status: UserStatus;
}

export interface UpdateUserRoleInterface {
    updatedById: string;
    role: UserRole;
}