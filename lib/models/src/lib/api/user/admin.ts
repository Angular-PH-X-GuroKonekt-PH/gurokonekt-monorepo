import { avatarAttachmentsInterface } from "../attachments/avatars";
import { UserInterface } from "./user";

export interface AdminBase {
    baseInfo: UserInterface;
    avatar: avatarAttachmentsInterface | null;
    updatedById: string;
    updatedBy: UserInterface | null;
    updatedAt: string;
}