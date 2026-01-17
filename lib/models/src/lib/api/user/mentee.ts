import { MenteePreferredSessionType } from "../../models";
import { avatarAttachmentsInterface } from "../attachments/avatars";
import { UserInterface } from "./user";

export interface MenteeProfile {
    baseInfo: UserInterface;
    country: string;
    language: string | null;
    avatar: avatarAttachmentsInterface | null;
    bio: string;
    learningGoals: string[] | null;
    areasOfInterest: string[] | null;
    preferredSessionType: MenteePreferredSessionType;
    availability: string[] | null;
    updatedById: string;
    updatedBy: UserInterface | null;
    updatedAt: string;
}
