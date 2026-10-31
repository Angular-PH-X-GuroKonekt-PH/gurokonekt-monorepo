import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { MentorService } from './mentor.service';

describe('MentorService.getMentorProfileById', () => {
  it("keeps the mentor's badges when mapping the profile (#419)", async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(MentorService);
    const http = TestBed.inject(HttpTestingController);
    const badge = {
      id: 'mvp',
      name: 'Microsoft MVP',
      icon: '🏆',
      color: 'blue',
      description: 'Recognised by Microsoft',
      awardedAt: '2026-10-31T00:00:00.000Z',
      expiresAt: null,
    };

    const result = firstValueFrom(service.getMentorProfileById('m1'));
    http.expectOne((req) => req.url.endsWith('/search/mentor/m1')).flush({
      status: 'success',
      data: {
        id: 'p1',
        title: 'Engineer',
        bio: 'bio',
        areasOfExpertise: [],
        yearsOfExperience: 5,
        skills: [],
        sessionRate: 0,
        availability: [],
        availabilityTimezone: 'UTC',
        availabilityOverrides: [],
        linkedInUrl: null,
        updatedAt: '2026-10-31T00:00:00.000Z',
        badges: [badge],
        user: {
          id: 'm1',
          firstName: 'Maria',
          middleName: null,
          lastName: 'Santos',
          suffix: null,
          language: 'en',
          country: 'PH',
          timezone: 'Asia/Manila',
          avatarAttachments: [],
        },
      },
    });

    expect((await result)?.badges).toEqual([badge]);
    http.verify();
  });
});
