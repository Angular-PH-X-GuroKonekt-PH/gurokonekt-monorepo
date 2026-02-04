import { MentorProfile } from './api/user/mentor';
import { UserInterface } from './api/user/user';
import { UserRole, UserStatus } from './models';

export const CURRENT_MENTEE_NAME = 'Joy';

export const ASSIGNED_MENTOR: MentorProfile = {
  baseInfo: {
    id: 'm1',
    firstName: 'Dr. Sarah',
    middleName: '',
    lastName: 'Johnson',
    suffix: '',
    email: 'sarah.johnson@example.com',
    role: UserRole.Mentor,
    status: UserStatus.Active,
    createdBy: null,
    updatedBy: null,
    createdById: 'm1',
    updatedById: 'm1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  country: 'US',
  language: 'English',
  yearsOfExperience: 8,
  linkedInUrl: 'https://linkedin.com/in/sarah-johnson',
  verificationDocuments: null,
  avatar: {
    userId: 'm1',
    avatarStoragePath: '/avatars/m1.jpg',
    avatarPublicUrl: 'https://i.pravatar.cc/120?img=47',
    avatarFileType: 'image/jpeg',
    avatarFileSize: 45000,
    avatarFileName: 'sarah_johnson_avatar.jpg'
  },
  bio: 'Staff Engineer specializing in Full-Stack Engineering & Career Growth with 8+ years of experience.',
  skills: ['Angular', 'TypeScript', 'System Design', 'Career Coaching'],
  sessionRate: 150,
  availability: ['Monday 9-17', 'Wednesday 9-17', 'Friday 9-17'],
  updatedById: 'm1',
  updatedBy: null,
  updatedAt: '2025-01-01T00:00:00Z',
};
