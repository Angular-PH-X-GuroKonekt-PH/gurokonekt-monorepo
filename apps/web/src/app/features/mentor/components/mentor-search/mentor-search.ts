import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AvailabilityOption,
  MentorSearchFilter,
} from '@gurokonekt/models/interfaces/search/search.model';
import { DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { EXPERTISE_OPTIONS } from 'apps/web/src/app/shared/constants';
import { APP_ROUTES } from 'apps/web/src/app/shared/constants/routes';

type FilterDropdown = 'expertise' | 'skills' | 'availability' | null;

@Component({
  selector: 'app-mentor-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './mentor-search.html',
})
export class MentorSearch {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  activeFilterDropdown = signal<FilterDropdown>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  selectedSkills = signal<string[]>([]);
  selectedExpertise = signal<string[]>([]);
  skillQuery = signal('');

  allExpertise = signal<string[]>(EXPERTISE_OPTIONS);

  filterForm: FormGroup = this.fb.group({
    name: [''],
    availabilityDay: [null],
  });

  readonly availabilityOptions: {
    label: string;
    value: AvailabilityOption | null;
  }[] = [
    { label: 'Monday', value: DaysInWeek.Monday },
    { label: 'Tuesday', value: DaysInWeek.Tuesday },
    { label: 'Wednesday', value: DaysInWeek.Wednesday },
    { label: 'Thursday', value: DaysInWeek.Thursday },
    { label: 'Friday', value: DaysInWeek.Friday },
    { label: 'Saturday', value: DaysInWeek.Saturday },
    { label: 'Sunday', value: DaysInWeek.Sunday },
    { label: 'Any time', value: null },
  ];

  constructor() {
    const params = this.route.snapshot.queryParams;
    if (Object.keys(params).length) {
      this.hydrateFromParams(params);
    }
  }

  activeFilterCount(): number {
    const value = this.filterForm.value ?? {};

    return [
      !!value.name?.trim(),
      this.selectedSkills().length > 0,
      this.selectedExpertise().length > 0,
      value.availabilityDay != null,
    ].filter(Boolean).length;
  }

  addSkill(skill: string): void {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) {
      return;
    }

    if (!this.selectedSkills().includes(trimmedSkill)) {
      this.selectedSkills.update((skills) => [...skills, trimmedSkill]);
    }

    this.skillQuery.set('');
  }

  removeSkill(skill: string): void {
    this.selectedSkills.update((skills) =>
      skills.filter((item) => item !== skill)
    );
  }

  toggleExpertise(option: string): void {
    this.selectedExpertise.update((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  }

  isExpertiseSelected(option: string): boolean {
    return this.selectedExpertise().includes(option);
  }

  selectAvailabilityDay(value: AvailabilityOption | null): void {
    const control = this.filterForm.get('availabilityDay')!;
    control.setValue(control.value === value ? null : value);
  }

  getAvailabilityLabel(value: AvailabilityOption | null): string {
    return (
      this.availabilityOptions.find((option) => option.value === value)
        ?.label ?? 'Any Time'
    );
  }

  toggleFilterDropdown(dropdown: Exclude<FilterDropdown, null>): void {
    this.activeFilterDropdown.update((current) =>
      current === dropdown ? null : dropdown
    );
  }

  findMentors(): void {
    if (this.isLoading()) {
      return;
    }

    this.addSkill(this.skillQuery());

    const filters = this.buildFilters();
    this.activeFilterDropdown.set(null);

    this.router.navigate([APP_ROUTES.FIND_MENTORS], {
      queryParams: {
        name: filters.name || null,
        skills: filters.skills.length ? filters.skills.join(',') : null,
        expertise: filters.expertise.length
          ? filters.expertise.join(',')
          : null,
        availabilityDay: filters.availabilityDay ?? null,
        page: 1,
        limit: filters.limit,
      },
    });
  }

  resetFilters(): void {
    this.filterForm.reset({
      name: '',
      availabilityDay: null,
    });

    this.selectedSkills.set([]);
    this.selectedExpertise.set([]);
    this.skillQuery.set('');
    this.activeFilterDropdown.set(null);
    this.errorMessage.set(null);

    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  buildFilters(): MentorSearchFilter {
    return {
      name: this.filterForm.value.name ?? null,
      availabilityDay: this.filterForm.value.availabilityDay ?? null,
      skills: this.selectedSkills(),
      expertise: this.selectedExpertise(),
      page: 1,
      limit: 10,
    };
  }

  trackBySkill(_: number, skill: string): string {
    return skill;
  }

  private hydrateFromParams(params: Record<string, string>): void {
    this.patchFilterControl('name', params['name']);

    if (params['skills']) {
      this.selectedSkills.set(params['skills'].split(',').filter(Boolean));
    }

    if (params['expertise']) {
      this.selectedExpertise.set(
        params['expertise'].split(',').filter(Boolean)
      );
    }

    if (params['availabilityDay']) {
      this.patchFilterControl(
        'availabilityDay',
        params['availabilityDay'] as AvailabilityOption
      );
    }
  }

  private patchFilterControl(controlName: string, value: unknown): void {
    this.filterForm.get(controlName)?.setValue(value, { emitEvent: false });
  }
}
