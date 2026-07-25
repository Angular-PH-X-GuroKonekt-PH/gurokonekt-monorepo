import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  MentorProfileInterface,
  UserAvailabilityInterface,
  UserRole,
  UserStatus,
  UserFlatInterface,
} from '@gurokonekt/models/interfaces/user/user.model';
import {
  MentorProfileDetailInterface,
  MentorSearchItemInterface,
  MentorSearchResultInterface,
} from '@gurokonekt/models/interfaces/search/search.model';
import { catchError, map, Observable, of } from 'rxjs';

import { ApiResponse } from '../interfaces/api-response.interface';
import { buildApiUrl } from '../utils/api.util';

@Injectable({
  providedIn: 'root',
})
export class MentorService {
  private readonly http = inject(HttpClient);

  getAllMentorProfiles(): Observable<MentorProfileInterface[]> {
    const params = new HttpParams().set('page', '1').set('limit', '50');

    return this.http
      .get<ApiResponse<MentorSearchResultInterface>>(
        buildApiUrl('/search'),
        { params }
      )
      .pipe(
        map((response) => response.data?.results ?? []),
        map((mentors) =>
          mentors.map((mentor) => this.mapSearchItemToMentorProfile(mentor))
        ),
        catchError((error) => {
          console.error('mentor search api request failed', error);
          return of([]);
        })
      );
  }

  getMentorProfileById(
    mentorId: string
  ): Observable<MentorProfileInterface | null> {
    return this.http
      .get<ApiResponse<MentorProfileDetailInterface>>(
        buildApiUrl(`/search/mentor/${mentorId}`)
      )
      .pipe(
        map((response) => response.data ?? null),
        map((mentor) =>
          mentor ? this.mapMentorDetailToMentorProfile(mentor) : null
        ),
        catchError((error) => {
          console.error('mentor detail api request failed', error);
          return of(null);
        })
      );
  }

  private mapSearchItemToMentorProfile(
    mentor: MentorSearchItemInterface
  ): MentorProfileInterface {
    const profile = mentor.mentorProfiles[0];
    const avatar = mentor.avatarAttachments[0];

    return {
      id: profile?.id ?? mentor.id,
      bio: profile?.bio ?? '',
      areasOfExpertise: profile?.areasOfExpertise ?? [],
      yearsOfExperience: profile?.yearsOfExperience ?? 0,
      linkedInUrl: profile?.linkedInUrl ?? '',
      skills: profile?.skills ?? [],
      sessionRate: profile?.sessionRate ?? 0,
      availability: this.normalizeAvailability(profile?.availability),
      updatedAt: profile?.updatedAt
        ? String(profile.updatedAt)
        : String(mentor.createdAt),
      updatedBy: this.buildFallbackUpdatedBy(),
      user: {
        id: mentor.id,
        firstName: mentor.firstName,
        middleName: mentor.middleName ?? '',
        lastName: mentor.lastName,
        suffix: mentor.suffix ?? '',
        email: mentor.email,
        phoneNumber: '',
        country: mentor.country ?? '',
        language: mentor.language ?? '',
        timezone: mentor.timezone ?? '',
        isProfileComplete: true,
        isMentorProfileComplete: mentor.isMentorProfileComplete,
        isMentorApproved: mentor.isMentorApproved,
        role: UserRole.Mentor,
        status: UserStatus.Active,
        createdAt: String(mentor.createdAt),
        updatedAt: profile?.updatedAt
          ? String(profile.updatedAt)
          : String(mentor.createdAt),
        avatarAttachments: {
          id: '',
          userId: mentor.id,
          bucketName: '',
          storagePath: '',
          publicUrl: avatar?.publicUrl ?? '',
          fileType: '',
          fileSize: '',
          fileName: avatar?.fileName ?? '',
        },
        createdBy: this.buildFallbackUpdatedBy(),
        updatedBy: this.buildFallbackUpdatedBy(),
      },
    };
  }

  private mapMentorDetailToMentorProfile(
    mentor: MentorProfileDetailInterface
  ): MentorProfileInterface {
    const avatar = mentor.user.avatarAttachments[0];

    return {
      id: mentor.id,
      bio: mentor.bio ?? '',
      areasOfExpertise: mentor.areasOfExpertise ?? [],
      yearsOfExperience: mentor.yearsOfExperience ?? 0,
      linkedInUrl: mentor.linkedInUrl ?? '',
      skills: mentor.skills ?? [],
      sessionRate: mentor.sessionRate ?? 0,
      availability: this.normalizeAvailability(mentor.availability),
      updatedAt: String(mentor.updatedAt),
      updatedBy: this.buildFallbackUpdatedBy(),
      user: {
        id: mentor.user.id,
        firstName: mentor.user.firstName,
        middleName: mentor.user.middleName ?? '',
        lastName: mentor.user.lastName,
        suffix: mentor.user.suffix ?? '',
        email: '',
        phoneNumber: '',
        country: mentor.user.country ?? '',
        language: mentor.user.language ?? '',
        timezone: mentor.user.timezone ?? '',
        isProfileComplete: true,
        isMentorProfileComplete: true,
        isMentorApproved: true,
        role: UserRole.Mentor,
        status: UserStatus.Active,
        createdAt: '',
        updatedAt: String(mentor.updatedAt),
        avatarAttachments: {
          id: '',
          userId: mentor.user.id,
          bucketName: '',
          storagePath: '',
          publicUrl: avatar?.publicUrl ?? '',
          fileType: '',
          fileSize: '',
          fileName: avatar?.fileName ?? '',
        },
        createdBy: this.buildFallbackUpdatedBy(),
        updatedBy: this.buildFallbackUpdatedBy(),
      },
    };
  }

  private normalizeAvailability(
    availability: unknown
  ): UserAvailabilityInterface[] {
    return Array.isArray(availability)
      ? (availability as UserAvailabilityInterface[])
      : [];
  }

  private buildFallbackUpdatedBy(): UserFlatInterface {
    return {
      id: '',
      firstName: '',
      lastName: '',
    };
  }
}
