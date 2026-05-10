import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NgxsModule, Store } from '@ngxs/store';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { MenteeLayout } from './mentee.layout';
import { ProfileService } from '../../core/profile/profile.service';
import { NotificationService } from '../../shared/services/notification.service';

describe('MenteeLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenteeLayout, NgxsModule.forRoot([])],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: Store, useValue: { selectSnapshot: vi.fn(), dispatch: vi.fn(), selectSignal: vi.fn().mockReturnValue(() => null) } },
        { provide: ProfileService, useValue: { getUserProfile: vi.fn().mockReturnValue(of({ data: null })) } },
        { provide: NotificationService, useValue: { getMyNotifications: vi.fn().mockReturnValue(of([])), notifications$: of([]), markAsRead: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MenteeLayout);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
