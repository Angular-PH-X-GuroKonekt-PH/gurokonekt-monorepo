import { avatarAttachmentsInterface } from "../attachments/avatars";
import { documentsAttachmentsInterface } from "../attachments/documents";
import { UserInterface } from "./user";

export interface MentorProfile {
    baseInfo: UserInterface;
    country: string;
    language: string | null;
    yearsOfExperience: number | null;
    linkedInUrl: string | null;
    verificationDocuments: documentsAttachmentsInterface[] | null;
    avatar: avatarAttachmentsInterface | null;
    bio: string | null;
    skills: string[] | null;
    sessionRate: number | null;
    availability: string[] | null;
    updatedById: string;
    updatedBy: UserInterface | null;
    updatedAt: string;
}
