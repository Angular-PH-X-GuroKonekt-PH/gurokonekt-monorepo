import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

export interface MentorData {
  baseInfo: {
    firstName: string;
    lastName: string;
  };
  bio: string | null;
  avatar?: {
    avatarPublicUrl?: string;
  } | null;
  skills?: string[] | null;
  yearsOfExperience?: number;
  country?: string;
  language?: string;
  sessionRate?: number;
}

export type MentorCardVariant = 'compact' | 'detailed';

@Component({
  selector: 'app-mentor-card',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <!-- Compact variant - for header/sidebar use -->
    @if (variant() === 'compact') {
      <div class="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm lg:min-w-[280px]">
        <img
          [ngSrc]="(mentor().avatar?.avatarPublicUrl) || 'https://i.pravatar.cc/120?img=47'"
          width="60"
          height="60"
          class="h-15 w-15 rounded-full border-2 border-white object-cover"
          [alt]="mentor().baseInfo.firstName + ' ' + mentor().baseInfo.lastName + ' avatar'"
        />
        <div>
          <p class="text-sm text-blue-100">{{ label() || 'Your mentor' }}</p>
          <p class="font-semibold">{{ mentor().baseInfo.firstName }} {{ mentor().baseInfo.lastName }}</p>
          <p class="text-sm text-blue-100">{{ mentor().bio || 'No bio available' }}</p>
        </div>
      </div>
    }

    <!-- Detailed variant - for main content -->
    @if (variant() === 'detailed') {
      <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            {{ title() || 'Your Mentor' }}
          </h2>
          <p class="text-sm text-gray-600">{{ subtitle() || 'Get to know your assigned mentor' }}</p>
        </div>
        <div class="p-6">
          <div class="flex items-start gap-6">
            <img
              [ngSrc]="(mentor().avatar?.avatarPublicUrl) || 'https://i.pravatar.cc/120?img=47'"
              width="80"
              height="80"
              class="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
              [alt]="mentor().baseInfo.firstName + ' ' + mentor().baseInfo.lastName + ' avatar'"
            />
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-gray-900">
                {{ mentor().baseInfo.firstName }} {{ mentor().baseInfo.lastName }}
              </h3>
              <p class="mt-1 text-gray-600">{{ mentor().bio || 'No bio available' }}</p>
              
              @if (mentor().skills?.length) {
                <div class="mt-4">
                  <h4 class="font-medium text-gray-900">Skills</h4>
                  <div class="mt-2 flex flex-wrap gap-2">
                    @for (skill of mentor().skills!; track skill) {
                      <span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {{ skill }}
                      </span>
                    }
                  </div>
                </div>
              }
              
              <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                @if (mentor().yearsOfExperience) {
                  <div>
                    <span class="font-medium text-gray-900">Experience:</span>
                    <span class="text-gray-600">{{ mentor().yearsOfExperience }} years</span>
                  </div>
                }
                @if (mentor().country) {
                  <div>
                    <span class="font-medium text-gray-900">Country:</span>
                    <span class="text-gray-600">{{ mentor().country }}</span>
                  </div>
                }
                @if (mentor().language) {
                  <div>
                    <span class="font-medium text-gray-900">Language:</span>
                    <span class="text-gray-600">{{ mentor().language }}</span>
                  </div>
                }
                @if (mentor().sessionRate) {
                  <div>
                    <span class="font-medium text-gray-900">Rate:</span>
                    <span class="text-gray-600">\${{ mentor().sessionRate }}/session</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </section>
    }
  `,
})
export class MentorCardComponent {
  mentor = input.required<MentorData>();
  variant = input<MentorCardVariant>('compact');
  title = input<string>();
  subtitle = input<string>();
  label = input<string>();
}