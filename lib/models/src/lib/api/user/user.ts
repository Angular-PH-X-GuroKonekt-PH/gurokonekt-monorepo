import { UserRole, UserStatus } from "../../models";

export interface UserBase {
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    email: string;
    role: UserRole;
    status: UserStatus;
}

export interface UserInterface extends UserBase {
    id: string;
    createdBy: UserInterface | null;
    updatedBy: UserInterface | null;
    createdById: string;
    updatedById: string;
    createdAt: string;
    updatedAt: string;
}
