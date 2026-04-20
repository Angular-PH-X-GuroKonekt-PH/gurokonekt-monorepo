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

import { buildApiUrl } from '../helpers/api.helper';
import {
  handleApiErrorWithFallback,
  validateApiResponse,
} from '../helpers/api-response.helper';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class MentorService {
  private readonly http = inject(HttpClient);

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

  getRecommendedMentors(limit = 6): Observable<MentorSearchItemInterface[]> {
    const params = new HttpParams().set('page', '1').set('limit', String(limit));

    return this.http
      .get<ApiResponse<MentorSearchResultInterface>>(buildApiUrl('/search'), {
        params,
      })
      .pipe(
        map((response) =>
          validateApiResponse<MentorSearchResultInterface>(
            response,
            'Failed to fetch recommended mentors.'
          )
        ),
        map((result) => result.results ?? []),
        catchError(
          handleApiErrorWithFallback([], 'Failed to fetch recommended mentors')
        )
      );
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
