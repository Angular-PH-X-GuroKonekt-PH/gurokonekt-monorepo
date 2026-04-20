import { Component, computed, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  MentorSearchFilter,
  AvailabilityOption,
  SearchSortBy,
  SearchSortOrder,
} from '@gurokonekt/models/interfaces/search/search.model';
import { IconComponent } from '../icon/icon.component';

const DUMMY_SKILLS = [
  'Angular',
  'React',
  'Vue',
  'Node.js',
  'Python',
  'Java',
  'TypeScript',
  'GraphQL',
  'Docker',
  'Kubernetes',
  'AWS',
  'Machine Learning',
  'Data Science',
  'UI/UX Design',
  'SQL',
  'PostgreSQL',
  'MongoDB',
];

const DUMMY_EXPERTISE = [
  'Frontend Development',
  'Backend Development',
  'Full Stack',
  'Mobile Development',
  'DevOps & Cloud',
  'Data & AI',
  'Design & UX',
  'Product Management',
  'Career Coaching',
  'Leadership',
];

@Component({
  selector: 'app-mentor-search',
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './mentor-search.html',
  styleUrl: './mentor-search.scss',
})
export class MentorSearch {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  showFilterPanel = signal(false);
  showSkillDropdown = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  selectedSkills = signal<string[]>([]);
  selectedExpertise = signal<string[]>([]);
  skillQuery = signal('');

  allSkills = signal<string[]>(DUMMY_SKILLS);
  allExpertise = signal<string[]>(DUMMY_EXPERTISE);

  filterForm: FormGroup = this.fb.group({
    name: [''],
    minRating: [null],
    availability: [null],
    minSessionRate: [null],
    maxSessionRate: [null],
    minYearsExperience: [null],
    sortBy: [null],
    sortOrder: [SearchSortOrder.DESC],
  });

  filteredSkills = computed(() =>
    this.allSkills().filter(
      (skill) =>
        skill.toLowerCase().includes(this.skillQuery().toLowerCase()) &&
        !this.selectedSkills().includes(skill)
    )
  );

  activeFilterCount(): number {
    const value = this.filterForm.value ?? {};

    return [
      !!value.name?.trim(),
      this.selectedSkills().length > 0,
      this.selectedExpertise().length > 0,
      value.minRating != null,
      value.availability != null,
      value.minSessionRate != null,
      value.maxSessionRate != null,
      value.minYearsExperience != null,
      !!value.sortBy,
    ].filter(Boolean).length;
  }

  readonly ratingOptions = [
    { label: '4★ & up', value: 4 },
    { label: '3★ & up', value: 3 },
    { label: '2★ & up', value: 2 },
    { label: 'Any', value: null },
  ];

  readonly availabilityOptions: { label: string; value: AvailabilityOption | null }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'this_week' },
    { label: 'This month', value: 'this_month' },
    { label: 'Any time', value: null },
  ];

  readonly sortByOptions: { label: string; value: SearchSortBy }[] = [
    { label: 'Newest', value: SearchSortBy.NEWEST },
    { label: 'Rate', value: SearchSortBy.SESSION_RATE },
    { label: 'Experience', value: SearchSortBy.YEARS_EXPERIENCE },
    { label: 'Name', value: SearchSortBy.NAME },
  ];

  readonly sortOrderOptions: { label: string; value: SearchSortOrder }[] = [
    { label: 'Descending', value: SearchSortOrder.DESC },
    { label: 'Ascending', value: SearchSortOrder.ASC },
  ];

  constructor() {
    const params = this.route.snapshot.queryParams;
    if (Object.keys(params).length) {
      this.hydrateFromParams(params);
    }
  }

  private hydrateFromParams(params: Record<string, string>): void {
    this.patchFilterControl('name', params['name']);

    if (params['skills']) {
      this.selectedSkills.set(params['skills'].split(',').filter(Boolean));
    }

    if (params['expertise']) {
      this.selectedExpertise.set(params['expertise'].split(',').filter(Boolean));
    }

    if (params['minRating']) {
      this.patchFilterControl('minRating', Number(params['minRating']));
    }

    if (params['availability']) {
      this.patchFilterControl('availability', params['availability'] as AvailabilityOption);
    }

    if (params['minSessionRate']) {
      this.patchFilterControl('minSessionRate', Number(params['minSessionRate']));
    }

    if (params['maxSessionRate']) {
      this.patchFilterControl('maxSessionRate', Number(params['maxSessionRate']));
    }

    if (params['minYearsExperience']) {
      this.patchFilterControl('minYearsExperience', Number(params['minYearsExperience']));
    }

    if (params['sortBy']) {
      this.patchFilterControl('sortBy', params['sortBy'] as SearchSortBy);
    }

    if (params['sortOrder']) {
      this.patchFilterControl('sortOrder', params['sortOrder'] as SearchSortOrder);
    }
  }

  private patchFilterControl(controlName: string, value: unknown): void {
    this.filterForm.get(controlName)?.setValue(value, { emitEvent: false });
  }

  onSkillInput(value: string): void {
    this.skillQuery.set(value);
    this.showSkillDropdown.set(value.length > 0);
  }

  addSkill(skill: string): void {
    if (!this.selectedSkills().includes(skill)) {
      this.selectedSkills.update((skills) => [...skills, skill]);
    }

    this.skillQuery.set('');
    this.showSkillDropdown.set(false);
  }

  removeSkill(skill: string): void {
    this.selectedSkills.update((skills) => skills.filter((item) => item !== skill));
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

  selectRating(value: number | null): void {
    this.filterForm.get('minRating')!.setValue(value);
  }

  selectAvailability(value: AvailabilityOption | null): void {
    this.filterForm.get('availability')!.setValue(value);
  }

  selectSortBy(value: SearchSortBy | null): void {
    this.filterForm.get('sortBy')!.setValue(value);
  }

  selectSortOrder(value: SearchSortOrder): void {
    this.filterForm.get('sortOrder')!.setValue(value);
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((value) => !value);
  }

  findMentors(): void {
    if (this.isLoading()) return;

    const filters = this.buildFilters();
    this.showFilterPanel.set(false);

    this.router.navigate(['mentee/find-mentors'], {
      queryParams: {
        name: filters.name || null,
        skills: filters.skills.length ? filters.skills.join(',') : null,
        expertise: filters.expertise.length ? filters.expertise.join(',') : null,
        minRating: filters.minRating ?? null,
        availability: filters.availability ?? null,
        minSessionRate: filters.minSessionRate ?? null,
        maxSessionRate: filters.maxSessionRate ?? null,
        minYearsExperience: filters.minYearsExperience ?? null,
        sortBy: filters.sortBy ?? null,
        sortOrder: filters.sortOrder ?? null,
        page: 1,
        limit: filters.limit,
      },
    });
  }

  resetFilters(): void {
    this.filterForm.reset({
      name: '',
      minRating: null,
      availability: null,
      minSessionRate: null,
      maxSessionRate: null,
      minYearsExperience: null,
      sortBy: null,
      sortOrder: SearchSortOrder.DESC,
    });

    this.selectedSkills.set([]);
    this.selectedExpertise.set([]);
    this.skillQuery.set('');
    this.showSkillDropdown.set(false);
    this.errorMessage.set(null);

    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  buildFilters(): MentorSearchFilter {
    return {
      ...this.filterForm.value,
      skills: this.selectedSkills(),
      expertise: this.selectedExpertise(),
      page: 1,
      limit: 10,
    };
  }

  trackBySkill(_: number, skill: string): string {
    return skill;
  }
}
