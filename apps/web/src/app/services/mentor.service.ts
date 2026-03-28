import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  DaysInWeek,
  MentorProfileInterface,
  UserRole,
  UserStatus,
} from '@gurokonekt/models/interfaces/user/user.model';
import { map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MentorService {
  private http = inject(HttpClient);

  useMock = true;

  getAllMentorProfiles(): Observable<MentorProfileInterface[]> {
    return this.useMock
      ? of(this.mockData)
      : this.http.get<MentorProfileInterface[]>('/api/v1/mentors');
  }

    getMentorProfileById(mentorId: string): Observable<MentorProfileInterface | null> {
    if (this.useMock) {
      const mentor =
        this.mockData.find((item) => item.user.id === mentorId) ?? null;

      return of(mentor);
    }

    return this.http
      .get<MentorProfileInterface>(`/api/mentor-profiles/${mentorId}`)
      .pipe(
        map((mentor) => mentor ?? null)
      );
  }

  

  private mockData: MentorProfileInterface[] = [
    {
      id: 'mentor-profile-1',
      bio: 'Frontend mentor specializing in Angular, scalable UI systems, and clean architecture.',
      areasOfExpertise: ['Angular', 'Frontend Development', 'UI Architecture'],
      yearsOfExperience: 6,
      linkedInUrl: 'https://linkedin.com/in/maria-santos',
      skills: ['Angular', 'TypeScript', 'RxJS', 'Tailwind CSS'],
      sessionRate: 500,
      availability: [
        {
          day: DaysInWeek.Monday,
          timeFrames: [
            { from: '09:00', to: '11:00' },
            { from: '14:00', to: '16:00' },
          ],
        },
        {
          day: DaysInWeek.Wednesday,
          timeFrames: [{ from: '10:00', to: '12:00' }],
        },
         {
          day: DaysInWeek.Thursday,
          timeFrames: [{ from: '10:00', to: '12:00' }],
        },
         {
          day: DaysInWeek.Friday,
          timeFrames: [{ from: '10:00', to: '12:00' }],
        },
      ],
      user: {
        id: 'mentor-1',
        firstName: 'Maria',
        middleName: 'Lopez',
        lastName: 'Santos',
        suffix: '',
        email: 'maria.santos@example.com',
        phoneNumber: '+639171111111',
        country: 'Philippines',
        language: 'English',
        timezone: 'Asia/Manila',
        isProfileComplete: true,
        isMentorProfileComplete: true,
        isMentorApproved: true,
        role: UserRole.Mentor,
        status: UserStatus.Active,
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-03-19T09:00:00Z',
        avatarAttachments: {
          id: 'avatar-1',
          userId: 'mentor-1',
          bucketName: 'avatars',
          storagePath: 'users/mentor-1/avatar/maria-santos.jpg',
          publicUrl: 'https://i.pravatar.cc/150?img=11',
          fileType: 'image/jpeg',
          fileSize: '245760',
          fileName: 'maria-santos.jpg',
        },
        createdBy: {
          id: 'admin-1',
          firstName: 'System',
          lastName: 'Admin',
        },
        updatedBy: {
          id: 'admin-1',
          firstName: 'System',
          lastName: 'Admin',
        },
      },
      updatedAt: '2026-03-19T09:00:00Z',
      updatedBy: {
        id: 'admin-1',
        firstName: 'System',
        lastName: 'Admin',
      },
    },
    {
      id: 'mentor-profile-2',
      bio: 'Backend and system design mentor with strong experience in NestJS, APIs, and database design.',
      areasOfExpertise: ['Backend Development', 'NestJS', 'System Design'],
      yearsOfExperience: 8,
      linkedInUrl: 'https://linkedin.com/in/john-reyes',
      skills: ['NestJS', 'Node.js', 'Prisma', 'MySQL'],
      sessionRate: 700,
      availability: [
        {
          day: DaysInWeek.Tuesday,
          timeFrames: [{ from: '13:00', to: '15:00' }],
        },
        {
          day: DaysInWeek.Thursday,
          timeFrames: [{ from: '09:00', to: '11:00' }],
        },
      ],
      user: {
        id: 'mentor-2',
        firstName: 'John',
        middleName: 'Garcia',
        lastName: 'Reyes',
        suffix: '',
        email: 'john.reyes@example.com',
        phoneNumber: '+639172222222',
        country: 'Philippines',
        language: 'English',
        timezone: 'Asia/Manila',
        isProfileComplete: true,
        isMentorProfileComplete: true,
        isMentorApproved: true,
        role: UserRole.Mentor,
        status: UserStatus.Active,
        createdAt: '2026-01-15T08:00:00Z',
        updatedAt: '2026-03-18T13:00:00Z',
        avatarAttachments: {
          id: 'avatar-2',
          userId: 'mentor-2',
          bucketName: 'avatars',
          storagePath: 'users/mentor-2/avatar/john-reyes.jpg',
          publicUrl: 'https://i.pravatar.cc/150?img=12',
          fileType: 'image/jpeg',
          fileSize: '261120',
          fileName: 'john-reyes.jpg',
        },
        createdBy: {
          id: 'admin-1',
          firstName: 'System',
          lastName: 'Admin',
        },
        updatedBy: {
          id: 'admin-1',
          firstName: 'System',
          lastName: 'Admin',
        },
      },
      updatedAt: '2026-03-18T13:00:00Z',
      updatedBy: {
        id: 'admin-1',
        firstName: 'System',
        lastName: 'Admin',
      },
    },
    {
      id: 'mentor-profile-3',
      bio: 'Product and career mentor focused on helping developers grow in real-world projects and teamwork.',
      areasOfExpertise: [
        'Career Development',
        'Product Thinking',
        'UX Strategy',
      ],
      yearsOfExperience: 5,
      linkedInUrl: 'https://linkedin.com/in/angela-cruz',
      skills: ['Mentorship', 'Communication', 'Problem Solving', 'Wireframing'],
      sessionRate: 450,
      availability: [
        {
          day: DaysInWeek.Friday,
          timeFrames: [{ from: '10:00', to: '12:00' }],
        },
      ],
      user: {
        id: 'mentor-3',
        firstName: 'Angela',
        middleName: 'Marie',
        lastName: 'Cruz',
        suffix: '',
        email: 'angela.cruz@example.com',
        phoneNumber: '+639173333333',
        country: 'Philippines',
        language: 'English',
        timezone: 'Asia/Manila',
        isProfileComplete: true,
        isMentorProfileComplete: true,
        isMentorApproved: true,
        role: UserRole.Mentor,
        status: UserStatus.Active,
        createdAt: '2026-01-20T08:00:00Z',
        updatedAt: '2026-03-17T08:30:00Z',
        avatarAttachments: {
          id: 'avatar-3',
          userId: 'mentor-3',
          bucketName: 'avatars',
          storagePath: 'users/mentor-3/avatar/angela-cruz.jpg',
          publicUrl: 'https://i.pravatar.cc/150?img=13',
          fileType: 'image/jpeg',
          fileSize: '238592',
          fileName: 'angela-cruz.jpg',
        },
        createdBy: {
          id: 'admin-1',
          firstName: 'System',
          lastName: 'Admin',
        },
        updatedBy: {
          id: 'admin-1',
          firstName: 'System',
          lastName: 'Admin',
        },
      },
      updatedAt: '2026-03-17T08:30:00Z',
      updatedBy: {
        id: 'admin-1',
        firstName: 'System',
        lastName: 'Admin',
      },
    },
    {
      id: 'mentor-profile-4',
      bio: 'Full-stack mentor with expertise in modern web applications and scalable backend systems.',
      areasOfExpertise: [
        'Full Stack Development',
        'API Design',
        'Cloud Basics',
      ],
      yearsOfExperience: 7,
      linkedInUrl: 'https://linkedin.com/in/mark-dela-cruz',
      skills: ['Node.js', 'Angular', 'Docker', 'MySQL'],
      sessionRate: 600,
      availability: [
        {
          day: DaysInWeek.Monday,
          timeFrames: [{ from: '15:00', to: '18:00' }],
        },
        {
          day: DaysInWeek.Saturday,
          timeFrames: [{ from: '09:00', to: '11:00' }],
        },
      ],
      user: {
        id: 'mentor-4',
        firstName: 'Mark',
        middleName: 'Jose',
        lastName: 'Dela Cruz',
        suffix: '',
        email: 'mark.delacruz@example.com',
        phoneNumber: '+639174444444',
        country: 'Philippines',
        language: 'English',
        timezone: 'Asia/Manila',
        isProfileComplete: true,
        isMentorProfileComplete: true,
        isMentorApproved: true,
        role: UserRole.Mentor,
        status: UserStatus.Active,
        createdAt: '2026-01-25T08:00:00Z',
        updatedAt: '2026-03-16T10:15:00Z',
        avatarAttachments: {
          id: 'avatar-4',
          userId: 'mentor-4',
          bucketName: 'avatars',
          storagePath: 'users/mentor-4/avatar/mark-dela-cruz.jpg',
          publicUrl: 'https://i.pravatar.cc/150?img=14',
          fileType: 'image/jpeg',
          fileSize: '253952',
          fileName: 'mark-dela-cruz.jpg',
        },
        createdBy: {
          id: 'admin-2',
          firstName: 'Admin',
          lastName: 'User',
        },
        updatedBy: {
          id: 'admin-2',
          firstName: 'Admin',
          lastName: 'User',
        },
      },
      updatedAt: '2026-03-16T10:15:00Z',
      updatedBy: {
        id: 'admin-2',
        firstName: 'Admin',
        lastName: 'User',
      },
    },
  ];
}
