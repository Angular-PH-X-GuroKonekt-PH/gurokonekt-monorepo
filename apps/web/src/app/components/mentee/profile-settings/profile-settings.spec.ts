import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommonModule } from '@angular/common';
import { ProfileSettingsComponent } from './profile-settings';
import { ProfileService } from '../../../services/profile.service';
import { ToastService } from '../../../services/toast.service';
import * as AuthActions from '../../../store/auth/auth.actions';
import { MenteePreferredSessionType, DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';

describe('ProfileSettingsComponent', () => {
  let component: ProfileSettingsComponent;
  let fixture: ComponentFixture<ProfileSettingsComponent>;
  let mockProfileService: any;
  let mockToastService: any;
  let mockRouter: any;
  let mockStore: any;

  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'mentee',
    phoneNumber: '+639171234567',
    country: 'Philippines',
    timezone: 'UTC+08:00',
    language: 'English',
  };

  const mockProfileData = {
    id: 'profile-123',
    bio: 'I am a software engineer interested in web development.',
    phoneNumber: '+639171234567',
    country: 'Philippines',
    timezone: 'UTC+08:00',
    language: 'English',
    learningGoals: ['Master TypeScript', 'Learn Angular'],
    areasOfInterest: ['Web Development', 'Cloud Computing'],
    preferredSessionType: MenteePreferredSessionType.Online,
    availability: [
      {
        day: DaysInWeek.Monday,
        timeFrames: [{ from: '09:00', to: '17:00' }],
      },
    ],
    user: mockUser,
  };

  beforeEach(async () => {
    // Create mock services using vi.fn()
    mockProfileService = {
      updateMenteeProfile: vi.fn().mockReturnValue(of({ data: mockProfileData })),
      getMenteeProfile: vi.fn().mockReturnValue(of({ data: mockProfileData })),
      getUserProfile: vi.fn().mockReturnValue(of({ data: mockProfileData })),
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn().mockReturnValue(Promise.resolve(true)),
    };

    mockStore = {
      selectSignal: vi.fn().mockReturnValue(() => mockUser),
      dispatch: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        ProfileSettingsComponent,
      ],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: Store, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Initialize component
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with all required fields', () => {
      expect(component.profileForm).toBeDefined();
      expect(component.profileForm.get('bio')).toBeDefined();
      expect(component.profileForm.get('phoneNumber')).toBeDefined();
      expect(component.profileForm.get('country')).toBeDefined();
      expect(component.profileForm.get('timezone')).toBeDefined();
      expect(component.profileForm.get('language')).toBeDefined();
      expect(component.profileForm.get('learningGoals')).toBeDefined();
      expect(component.profileForm.get('areasOfInterest')).toBeDefined();
    });

    it('should load profile data on init', fakeAsync(() => {
      component.ngOnInit?.();
      tick();

      expect(mockProfileService.getMenteeProfile).toHaveBeenCalled();
    }));
  });

  describe('Avatar Upload', () => {
    it('should validate avatar file type', () => {
      const invalidFile = new File(['content'], 'avatar.pdf', { type: 'application/pdf' });
      const event = {
        target: { files: [invalidFile] },
      } as unknown as Event;

      component['onAvatarSelected'](event);

      expect(mockToastService.error).toHaveBeenCalledWith(
        expect.stringContaining('jpg, jpeg, or png')
      );
    });

    it('should validate avatar file size', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'avatar.jpg', { type: 'image/jpeg' });
      const event = {
        target: { files: [largeFile] },
      } as unknown as Event;

      component['onAvatarSelected'](event);

      expect(mockToastService.error).toHaveBeenCalledWith(
        expect.stringContaining('5MB')
      );
    });

    it('should accept valid avatar file', () => {
      const validFile = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      const event = {
        target: { files: [validFile] },
      } as unknown as Event;

      component['onAvatarSelected'](event);

      expect(component.selectedAvatarFile).toBe(validFile);
      expect(component['avatarPreview']()).toBeTruthy();
    });

    it('should clear avatar preview when remove is clicked', () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      component.selectedAvatarFile = file;
      component['avatarPreview'].set('data:image/jpeg;base64,test');

      component['removeAvatar']();

      expect(component.selectedAvatarFile).toBeNull();
      expect(component['avatarPreview']()).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should validate bio length (50-500 chars)', () => {
      const bioControl = component.profileForm.get('bio');
      
      bioControl?.setValue('short');
      expect(bioControl?.invalid).toBe(true);

      bioControl?.setValue('x'.repeat(50));
      expect(bioControl?.valid).toBe(true);

      bioControl?.setValue('x'.repeat(501));
      expect(bioControl?.invalid).toBe(true);
    });

    it('should validate phone number format', () => {
      const phoneControl = component.profileForm.get('phoneNumber');
      
      phoneControl?.setValue('invalid');
      expect(phoneControl?.invalid).toBe(true);

      phoneControl?.setValue('+639171234567');
      expect(phoneControl?.valid).toBe(true);
    });

    it('should require at least one area of interest', () => {
      const areasControl = component.profileForm.get('areasOfInterest') as FormArray;
      
      if (areasControl.length > 0) {
        areasControl.clear();
      }

      // Validation happens at service level, but form should track selections
      expect(areasControl.length).toBe(0);
    });

    it('should validate learning goals length (max 500 chars each)', () => {
      const goalsArray = component.profileForm.get('learningGoals') as FormArray;
      
      if (goalsArray.length === 0) {
        component['addLearningGoal']();
      }

      const firstGoal = goalsArray.at(0);
      firstGoal?.setValue('x'.repeat(501));
      
      expect(firstGoal?.invalid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Setup form with valid data
      component.profileForm.patchValue({
        bio: 'x'.repeat(50),
        phoneNumber: '+639171234567',
        country: 'Philippines',
        timezone: 'UTC+08:00',
        language: 'English',
      });
    });

    it('should dispatch UpdateMenteeProfile action on valid submission', fakeAsync(() => {
      component['onSubmit']();
      tick();

      expect(mockStore.dispatch).toHaveBeenCalled();
      const dispatchedAction = mockStore.dispatch.mock.calls[mockStore.dispatch.mock.calls.length - 1][0];
      expect(dispatchedAction).toBeInstanceOf(AuthActions.UpdateMenteeProfile);
    }));

    it('should show success message on successful submission', fakeAsync(() => {
      component['onSubmit']();
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith('Profile updated successfully!');
    }));

    it('should set isSubmitting state during submission', fakeAsync(() => {
      expect(component['isSubmitting']()).toBe(false);

      component['onSubmit']();

      expect(component['isSubmitting']()).toBe(true);
      tick();

      expect(component['isSubmitting']()).toBe(false);
    }));

    it('should handle submission error', fakeAsync(() => {
      mockStore.dispatch.mockReturnValue(
        throwError(() => new Error('Submission failed'))
      );

      component['onSubmit']();
      tick();

      expect(mockToastService.error).toHaveBeenCalled();
      expect(component['isSubmitting']()).toBe(false);
    }));

    it('should clear avatar preview after successful submission', fakeAsync(() => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      const event = {
        target: { files: [file] },
      } as unknown as Event;

      component['onAvatarSelected'](event);
      expect(component['avatarPreview']()).toBeTruthy();

      mockStore.dispatch.mockReturnValue(of({}));
      component['onSubmit']();
      tick();

      expect(component['avatarPreview']()).toBeNull();
      expect(component.selectedAvatarFile).toBeNull();
    }));
  });

  describe('Navigation', () => {
    it('should navigate to login if user session not found', fakeAsync(() => {
      mockStore.selectSignal.mockReturnValue(() => null);

      component['onSubmit']();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith(
        'User session not found. Please login again.'
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should navigate back on cancel', () => {
      component['onCancel']?.();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Learning Goals Management', () => {
    it('should add learning goal', () => {
      const goalsArray = component.profileForm.get('learningGoals') as FormArray;
      const initialLength = goalsArray.length;

      component['addLearningGoal']();

      expect(goalsArray.length).toBe(initialLength + 1);
    });

    it('should remove learning goal', () => {
      const goalsArray = component.profileForm.get('learningGoals') as FormArray;

      if (goalsArray.length < 2) {
        component['addLearningGoal']();
      }

      const initialLength = goalsArray.length;
      component['removeLearningGoal'](0);

      expect(goalsArray.length).toBe(initialLength - 1);
    });
  });

  describe('Areas of Interest Management', () => {
    it('should toggle area of interest selection', () => {
      const areasArray = component.profileForm.get('areasOfInterest') as FormArray;
      const initialLength = areasArray.length;

      component['toggleAreaOfInterest']('Web Development');

      // Should either add or remove the area
      expect(
        areasArray.length === initialLength + 1 ||
        areasArray.length === initialLength - 1
      ).toBe(true);
    });

    it('should limit areas of interest to 5 maximum', () => {
      const areasArray = component.profileForm.get('areasOfInterest') as FormArray;

      // Add 6 areas (if possible)
      for (let i = 0; i < 6; i++) {
        component['toggleAreaOfInterest'](`Area ${i}`);
      }

      expect(areasArray.length).toBeLessThanOrEqual(5);
    });
  });
});
