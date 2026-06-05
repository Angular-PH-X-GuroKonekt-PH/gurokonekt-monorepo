import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AvailabilityOption,
  MentorSearchFilter,
} from '@gurokonekt/models/interfaces/search/search.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { EXPERTISE_OPTIONS, LANGUAGES } from '../../../../shared/constants';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import {
  MENTOR_SEARCH_AVAILABILITY_OPTIONS,
  MENTOR_SEARCH_EXPERIENCE_OPTIONS,
  MENTOR_SEARCH_RATING_OPTIONS,
} from '../../constants/mentor-search-filter.constants';
import { MentorSearchDropdown } from '../../interfaces/search-mentor.interface';

@Component({
  selector: 'app-mentor-search',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './mentor-search.html',
})
export class MentorSearch {
  // Injected services
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Form defaults
  private readonly defaultFilterFormValue = {
    name: '',
    availabilityDay: null,
    language: '',
    minYearsExperience: null,
    maxYearsExperience: null,
    minRating: null,
  };

  // Dropdown options
  readonly expertiseOptions = EXPERTISE_OPTIONS;
  readonly languageOptions = LANGUAGES;
  readonly experienceOptions = MENTOR_SEARCH_EXPERIENCE_OPTIONS;
  readonly ratingOptions = MENTOR_SEARCH_RATING_OPTIONS;
  readonly availabilityOptions = MENTOR_SEARCH_AVAILABILITY_OPTIONS;

  // Search form controls
  readonly filterForm = this.fb.group({
    name: [''],
    availabilityDay: [null as AvailabilityOption | null],
    language: [''],
    minYearsExperience: [null as number | null],
    maxYearsExperience: [null as number | null],
    minRating: [null as number | null],
  });

  // UI-only state
  readonly activeFilterDropdown = signal<MentorSearchDropdown>(null);
  readonly selectedSkills = signal<string[]>([]);
  readonly selectedExpertise = signal<string[]>([]);
  readonly skillQuery = signal('');

  constructor() {
    const params = this.route.snapshot.queryParams;

    if (Object.keys(params).length) {
      this.setFiltersFromUrl(params);
    }
  }

  // Main search actions
  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.findMentors();
  }

  findMentors(): void {
    this.addSkill(this.skillQuery());

    const filters = this.getFilters();
    this.activeFilterDropdown.set(null);

    this.router.navigate([APP_ROUTES.FIND_MENTORS], {
      queryParams: this.createUrlParams(filters),
    });
  }

  resetFilters(): void {
    this.filterForm.reset(this.defaultFilterFormValue);

    this.selectedSkills.set([]);
    this.selectedExpertise.set([]);
    this.skillQuery.set('');
    this.activeFilterDropdown.set(null);

    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  // Filter dropdown state
  activeFilterCount(): number {
    const value = this.filterForm.value ?? {};

    return [
      !!value.name?.trim(),
      this.selectedSkills().length > 0,
      this.selectedExpertise().length > 0,
      value.availabilityDay != null,
      !!value.language?.trim(),
      value.minYearsExperience != null,
      value.maxYearsExperience != null,
      value.minRating != null,
    ].filter(Boolean).length;
  }

  toggleFilterDropdown(dropdown: Exclude<MentorSearchDropdown, null>): void {
    this.activeFilterDropdown.update((current) =>
      current === dropdown ? null : dropdown
    );
  }

  // Skill filter handlers
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

  trackBySkill(_: number, skill: string): string {
    return skill;
  }

  // Expertise filter handlers
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

  // Availability filter handlers
  selectAvailabilityDay(value: AvailabilityOption | null): void {
    const control = this.filterForm.controls.availabilityDay;
    control.setValue(control.value === value ? null : value);
  }

  getAvailabilityLabel(value: AvailabilityOption | null): string {
    return (
      this.availabilityOptions.find((option) => option.value === value)
        ?.label ?? 'Any Time'
    );
  }

  // Experience filter handlers
  selectExperienceRange(option: {
    min: number | null;
    max: number | null;
  }): void {
    this.filterForm.patchValue({
      minYearsExperience: option.min,
      maxYearsExperience: option.max,
    });
  }

  getExperienceLabel(): string {
    const min = this.filterForm.controls.minYearsExperience.value;
    const max = this.filterForm.controls.maxYearsExperience.value;
    const option = this.experienceOptions.find(
      (item) => item.min === min && item.max === max
    );

    return option?.label ?? 'Any experience';
  }

  // Language filter handlers
  selectLanguage(value: string | null): void {
    this.filterForm.controls.language.setValue(value);
  }

  getLanguageLabel(): string {
    const languageCode = this.filterForm.controls.language.value;

    return (
      this.languageOptions.find((language) => language.value === languageCode)
        ?.label ?? 'Any Language'
    );
  }

  // Rating filter handlers
  selectRating(value: number | null): void {
    this.filterForm.controls.minRating.setValue(value);
  }

  getRatingLabel(): string {
    const rating = this.filterForm.controls.minRating.value;

    return (
      this.ratingOptions.find((option) => option.value === rating)?.label ??
      'Any rating'
    );
  }

  // Build data used for searching and URL navigation
  private getFilters(): MentorSearchFilter {
    const formValue = this.filterForm.value;

    return {
      name: formValue.name ?? null,
      availabilityDay: formValue.availabilityDay ?? null,
      language: formValue.language ?? null,
      minYearsExperience: this.getNumberOrNull(formValue.minYearsExperience),
      maxYearsExperience: this.getNumberOrNull(formValue.maxYearsExperience),
      minRating: this.getNumberOrNull(formValue.minRating),
      skills: this.selectedSkills(),
      expertise: this.selectedExpertise(),
      page: 1,
      limit: 10,
    };
  }

  private createUrlParams(
    filters: MentorSearchFilter
  ): Record<string, string | number | null> {
    return {
      name: filters.name || null,
      skills: filters.skills.length ? filters.skills.join(',') : null,
      expertise: filters.expertise.length ? filters.expertise.join(',') : null,
      availabilityDay: filters.availabilityDay ?? null,
      language: filters.language || null,
      minYearsExperience: filters.minYearsExperience ?? null,
      maxYearsExperience: filters.maxYearsExperience ?? null,
      minRating: filters.minRating ?? null,
      page: 1,
      limit: filters.limit,
    };
  }

  // Read filter values from the current URL
  private setFiltersFromUrl(params: Record<string, string>): void {
    this.setFilterValue('name', params['name']);
    this.setFilterValue('language', params['language']);

    this.selectedSkills.set(this.getListFromUrlParam(params, 'skills'));
    this.selectedExpertise.set(
      this.getListFromUrlParam(params, 'expertise')
    );

    if (params['availabilityDay']) {
      this.setFilterValue(
        'availabilityDay',
        params['availabilityDay'] as AvailabilityOption
      );
    }
    this.setNumberFilterFromUrl(params, 'minYearsExperience');
    this.setNumberFilterFromUrl(params, 'maxYearsExperience');
    this.setNumberFilterFromUrl(params, 'minRating');
  }

  private getListFromUrlParam(
    params: Record<string, string>,
    key: string
  ): string[] {
    return params[key]?.split(',').filter(Boolean) ?? [];
  }

  private setNumberFilterFromUrl(
    params: Record<string, string>,
    controlName:
      | 'minYearsExperience'
      | 'maxYearsExperience'
      | 'minRating'
  ): void {
    this.setFilterValue(
      controlName,
      this.getNumberOrNull(params[controlName])
    );
  }

  private setFilterValue(controlName: string, value: unknown): void {
    this.filterForm.get(controlName)?.setValue(value, { emitEvent: false });
  }

  private getNumberOrNull(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }
}
