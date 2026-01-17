import { LogsActionType } from "../../models";
import { UserInterface } from "../user/user";

export interface LogsBase {
    actionType: LogsActionType;
    targetId: string;
    details: string;
    metadata: unknown | null;
    ipAddress: string;
    userAgent: string;
}

export interface LogsInterface extends LogsBase {
    id: string;
    createdById: string;
    createdBy: UserInterface | null;
    createdAt: string;
    updatedById: string;
    updatedBy: UserInterface | null;
    updatedAt: string;
}