import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { switchMap, catchError, delay } from 'rxjs/operators';
import { Pagination } from '@gurokonekt/ui';
import { MentorSearchService } from '../../../services/mentor-search.service';
import { MentorSearch } from '../../shared/mentor-search/mentor-search';
import {
  MentorSearchResultInterface,
  MentorSearchItemInterface,
  FlatMentorCard,
  MentorSearchFilter,
  AvailabilityOption,
  SearchSortBy,
  SearchSortOrder,
} from '@gurokonekt/models/interfaces/search/search.model';
import { MentorCard } from "../../shared/mentor-card/mentor-card";

// Adapter
function toFlatCard(item: MentorSearchItemInterface): FlatMentorCard {
  const profile = item.mentorProfiles?.[0];
  const p = profile as any;
  const name = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ');

  return {
    id: item.id,
    fullName: name,
    avatarUrl: item.avatarAttachments?.[0]?.publicUrl ?? '',
    bio: profile?.bio ?? '',
    tagline: profile?.bio?.split('.')[0] ?? '',
    skills: profile?.skills ?? [],
    expertise: profile?.areasOfExpertise ?? [],
    rating: p?.rating ?? 0,
    reviewCount: p?.reviewCount ?? 0,
    availability: p?.availability ?? '',
    sessionRate: profile?.sessionRate ?? null,
    yearsOfExperience: profile?.yearsOfExperience ?? null,
  };
}

const DUMMY_RESULTS: MentorSearchItemInterface[] = [
  // ── React mentors (ids 1–15) ─────────────────────────────────────────────
  {
    id: '1',
    firstName: 'Ethan', middleName: null, lastName: 'Clarke', suffix: null,
    email: 'ethan@example.com', country: 'US', timezone: 'America/Los_Angeles', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2022-05-10'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=12', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p1',
      bio: 'Senior React Engineer at Airbnb. Specialises in performance optimisation and scalable component design.',
      areasOfExpertise: ['Frontend Development', 'Full Stack'],
      skills: ['React', 'TypeScript', 'Next.js', 'React Query', 'Zustand'],
      sessionRate: 130, yearsOfExperience: 9, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.9, reviewCount: 118, availability: 'today' },
    } as any],
  },
  {
    id: '2',
    firstName: 'Yuna', middleName: null, lastName: 'Park', suffix: null,
    email: 'yuna@example.com', country: 'KR', timezone: 'Asia/Seoul', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-01-20'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=44', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p2',
      bio: 'Frontend Lead at Kakao. Deep expertise in React architecture, design systems, and micro-frontends.',
      areasOfExpertise: ['Frontend Development', 'Design & UX'],
      skills: ['React', 'TypeScript', 'Storybook', 'CSS Modules', 'Vite'],
      sessionRate: 115, yearsOfExperience: 7, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.8, reviewCount: 87, availability: 'this_week' },
    } as any],
  },
  {
    id: '3',
    firstName: 'Omar', middleName: null, lastName: 'Hassan', suffix: null,
    email: 'omar@example.com', country: 'AE', timezone: 'Asia/Dubai', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2022-09-15'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=57', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p3',
      bio: 'Staff Engineer with 10+ years building React apps at scale. Mentor focus on hooks, testing, and DX.',
      areasOfExpertise: ['Frontend Development', 'Full Stack'],
      skills: ['React', 'TypeScript', 'Jest', 'React Testing Library', 'Webpack'],
      sessionRate: 160, yearsOfExperience: 11, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 5.0, reviewCount: 72, availability: 'this_month' },
    } as any],
  },
  {
    id: '4',
    firstName: 'Isabelle', middleName: null, lastName: 'Moreau', suffix: null,
    email: 'isabelle@example.com', country: 'FR', timezone: 'Europe/Paris', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-04-05'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=29', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p4',
      bio: 'React & GraphQL specialist. Previously at Algolia, now freelancing and coaching junior devs.',
      areasOfExpertise: ['Frontend Development', 'Career Coaching'],
      skills: ['React', 'TypeScript', 'GraphQL', 'Apollo Client', 'Tailwind CSS'],
      sessionRate: 105, yearsOfExperience: 6, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.7, reviewCount: 55, availability: 'today' },
    } as any],
  },
  {
    id: '5',
    firstName: 'Lucas', middleName: null, lastName: 'Ferreira', suffix: null,
    email: 'lucas@example.com', country: 'BR', timezone: 'America/Sao_Paulo', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2021-12-01'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=65', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p5',
      bio: 'Engineering Manager at Nubank. Coaches on React best practices, code review culture, and team growth.',
      areasOfExpertise: ['Frontend Development', 'Leadership'],
      skills: ['React', 'TypeScript', 'Redux Toolkit', 'React Router', 'Monorepos'],
      sessionRate: 145, yearsOfExperience: 10, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.6, reviewCount: 193, availability: 'this_week' },
    } as any],
  },
  {
    id: '6',
    firstName: 'Aiko', middleName: null, lastName: 'Tanaka', suffix: null,
    email: 'aiko@example.com', country: 'JP', timezone: 'Asia/Tokyo', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-07-18'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=33', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p6',
      bio: 'React Native & React Web engineer at LINE. Passionate about accessibility and cross-platform UX.',
      areasOfExpertise: ['Frontend Development', 'Design & UX'],
      skills: ['React', 'React Native', 'TypeScript', 'Expo', 'Accessibility'],
      sessionRate: 120, yearsOfExperience: 5, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.5, reviewCount: 41, availability: 'this_month' },
    } as any],
  },
  {
    id: '7',
    firstName: 'Daniel', middleName: null, lastName: 'Osei', suffix: null,
    email: 'daniel@example.com', country: 'GH', timezone: 'Africa/Accra', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-02-14'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=68', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p7',
      bio: 'Frontend engineer and open-source contributor. Focused on React state management patterns and SSR.',
      areasOfExpertise: ['Frontend Development', 'Full Stack'],
      skills: ['React', 'TypeScript', 'Next.js', 'Jotai', 'Prisma'],
      sessionRate: 90, yearsOfExperience: 5, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.7, reviewCount: 63, availability: 'today' },
    } as any],
  },
  {
    id: '8',
    firstName: 'Sofia', middleName: null, lastName: 'Rossi', suffix: null,
    email: 'sofia@example.com', country: 'IT', timezone: 'Europe/Rome', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2022-11-30'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=38', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p8',
      bio: 'UI Engineer at Spotify with a passion for animation, motion design, and React component libraries.',
      areasOfExpertise: ['Frontend Development', 'Design & UX'],
      skills: ['React', 'TypeScript', 'Framer Motion', 'Radix UI', 'CSS-in-JS'],
      sessionRate: 125, yearsOfExperience: 7, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.9, reviewCount: 79, availability: 'this_week' },
    } as any],
  },
  {
    id: '9',
    firstName: 'Ravi', middleName: null, lastName: 'Sharma', suffix: null,
    email: 'ravi@example.com', country: 'IN', timezone: 'Asia/Kolkata', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2021-08-22'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=53', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p9',
      bio: 'Principal Engineer at Razorpay. Expert in React performance, code splitting, and large monorepo setups.',
      areasOfExpertise: ['Frontend Development', 'Full Stack'],
      skills: ['React', 'TypeScript', 'Webpack', 'Turborepo', 'React Query'],
      sessionRate: 110, yearsOfExperience: 12, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.8, reviewCount: 144, availability: 'this_month' },
    } as any],
  },
  {
    id: '10',
    firstName: 'Nina', middleName: null, lastName: 'Kovač', suffix: null,
    email: 'nina@example.com', country: 'HR', timezone: 'Europe/Zagreb', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-05-09'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=23', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p10',
      bio: 'Freelance React consultant specialising in e-commerce storefronts and headless CMS integrations.',
      areasOfExpertise: ['Frontend Development', 'Full Stack'],
      skills: ['React', 'TypeScript', 'Next.js', 'Contentful', 'Shopify Hydrogen'],
      sessionRate: 100, yearsOfExperience: 6, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.6, reviewCount: 50, availability: 'today' },
    } as any],
  },
  {
    id: '11',
    firstName: 'Marcus', middleName: null, lastName: 'Nguyen', suffix: null,
    email: 'marcus@example.com', country: 'AU', timezone: 'Australia/Sydney', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2022-03-17'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=61', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p11',
      bio: 'Senior engineer at Atlassian. Coaches teams on scalable React patterns, Cypress E2E, and CI pipelines.',
      areasOfExpertise: ['Frontend Development', 'DevOps & Cloud'],
      skills: ['React', 'TypeScript', 'Cypress', 'GitHub Actions', 'Nx'],
      sessionRate: 140, yearsOfExperience: 8, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.7, reviewCount: 96, availability: 'this_week' },
    } as any],
  },
  {
    id: '12',
    firstName: 'Amara', middleName: null, lastName: 'Diallo', suffix: null,
    email: 'amara@example.com', country: 'SN', timezone: 'Africa/Dakar', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-08-03'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=36', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p12',
      bio: 'React developer and bootcamp instructor. Specialises in mentoring career-changers entering frontend.',
      areasOfExpertise: ['Frontend Development', 'Career Coaching'],
      skills: ['React', 'JavaScript', 'TypeScript', 'React Router', 'Tailwind CSS'],
      sessionRate: 75, yearsOfExperience: 4, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.9, reviewCount: 38, availability: 'today' },
    } as any],
  },
  {
    id: '13',
    firstName: 'Henrik', middleName: null, lastName: 'Berg', suffix: null,
    email: 'henrik@example.com', country: 'SE', timezone: 'Europe/Stockholm', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2022-07-25'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=70', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p13',
      bio: 'React architect at Klarna. Focused on micro-frontend strategy, module federation, and type-safe APIs.',
      areasOfExpertise: ['Frontend Development', 'Full Stack'],
      skills: ['React', 'TypeScript', 'Module Federation', 'tRPC', 'Vite'],
      sessionRate: 155, yearsOfExperience: 11, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.8, reviewCount: 107, availability: 'this_month' },
    } as any],
  },
  {
    id: '14',
    firstName: 'Mei', middleName: null, lastName: 'Chen', suffix: null,
    email: 'mei@example.com', country: 'TW', timezone: 'Asia/Taipei', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-03-11'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=41', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p14',
      bio: 'Frontend engineer at TSMC Digital. Passionate about React concurrent features, Suspense, and data fetching.',
      areasOfExpertise: ['Frontend Development'],
      skills: ['React', 'TypeScript', 'React Suspense', 'SWR', 'Remix'],
      sessionRate: 120, yearsOfExperience: 6, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.6, reviewCount: 59, availability: 'this_week' },
    } as any],
  },
  {
    id: '15',
    firstName: 'Andre', middleName: null, lastName: 'Kowalski', suffix: null,
    email: 'andre@example.com', country: 'PL', timezone: 'Europe/Warsaw', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2021-10-06'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=15', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p15',
      bio: 'Staff frontend engineer at Allegro. Leads React migration projects and internal tooling for dev teams.',
      areasOfExpertise: ['Frontend Development', 'Leadership'],
      skills: ['React', 'TypeScript', 'Storybook', 'Playwright', 'Design Tokens'],
      sessionRate: 135, yearsOfExperience: 10, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.7, reviewCount: 82, availability: 'this_month' },
    } as any],
  },

  // ── Non-React mentors (ids 16–25) ────────────────────────────────────────
  {
    id: '16',
    firstName: 'Lena', middleName: null, lastName: 'Fischer', suffix: null,
    email: 'lena@example.com', country: 'DE', timezone: 'Europe/Berlin', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2022-06-14'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=16', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p16',
      bio: 'Vue.js core contributor and senior frontend engineer at SAP. Specialist in Composition API and Nuxt 3.',
      areasOfExpertise: ['Frontend Development', 'Full Stack'],
      skills: ['Vue.js', 'TypeScript', 'Nuxt 3', 'Pinia', 'Vite'],
      sessionRate: 125, yearsOfExperience: 8, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.9, reviewCount: 103, availability: 'today' },
    } as any],
  },
  {
    id: '17',
    firstName: 'James', middleName: null, lastName: 'Whitfield', suffix: null,
    email: 'james.w@example.com', country: 'GB', timezone: 'Europe/London', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2021-09-30'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=18', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p17',
      bio: 'Angular architect at HSBC. Deep expertise in enterprise Angular, RxJS, and NgRx state management.',
      areasOfExpertise: ['Frontend Development', 'Full Stack'],
      skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Angular Material'],
      sessionRate: 150, yearsOfExperience: 11, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.8, reviewCount: 134, availability: 'this_week' },
    } as any],
  },
  {
    id: '18',
    firstName: 'Chiara', middleName: null, lastName: 'Bianchi', suffix: null,
    email: 'chiara@example.com', country: 'IT', timezone: 'Europe/Rome', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-02-01'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=26', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p18',
      bio: 'Svelte and SvelteKit engineer at a Milan-based startup. Loves building blazing-fast UIs with minimal JS.',
      areasOfExpertise: ['Frontend Development'],
      skills: ['Svelte', 'SvelteKit', 'TypeScript', 'Tailwind CSS', 'Vitest'],
      sessionRate: 95, yearsOfExperience: 5, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.7, reviewCount: 47, availability: 'today' },
    } as any],
  },
  {
    id: '19',
    firstName: 'Kwame', middleName: null, lastName: 'Asante', suffix: null,
    email: 'kwame@example.com', country: 'GH', timezone: 'Africa/Accra', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2022-04-19'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=59', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p19',
      bio: 'Backend engineer specialising in Node.js, Express, and PostgreSQL. Mentors developers on API design.',
      areasOfExpertise: ['Backend Development', 'Full Stack'],
      skills: ['Node.js', 'Express', 'PostgreSQL', 'TypeScript', 'Docker'],
      sessionRate: 100, yearsOfExperience: 7, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.6, reviewCount: 88, availability: 'this_month' },
    } as any],
  },
  {
    id: '20',
    firstName: 'Hana', middleName: null, lastName: 'Novák', suffix: null,
    email: 'hana@example.com', country: 'CZ', timezone: 'Europe/Prague', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-06-07'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=31', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p20',
      bio: 'Python & Django engineer at Kiwi.com. Focuses on clean architecture, REST APIs, and async Python.',
      areasOfExpertise: ['Backend Development', 'DevOps & Cloud'],
      skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Celery'],
      sessionRate: 110, yearsOfExperience: 6, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.8, reviewCount: 66, availability: 'this_week' },
    } as any],
  },
  {
    id: '21',
    firstName: 'Tariq', middleName: null, lastName: 'Al-Rashid', suffix: null,
    email: 'tariq@example.com', country: 'SA', timezone: 'Asia/Riyadh', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2022-01-25'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=62', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p21',
      bio: 'iOS engineer at STC with 9 years of Swift experience. Coaches developers on SwiftUI and Combine.',
      areasOfExpertise: ['Mobile Development', 'Full Stack'],
      skills: ['Swift', 'SwiftUI', 'Combine', 'Xcode', 'CoreData'],
      sessionRate: 140, yearsOfExperience: 9, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.9, reviewCount: 91, availability: 'today' },
    } as any],
  },
  {
    id: '22',
    firstName: 'Priya', middleName: null, lastName: 'Iyer', suffix: null,
    email: 'priya.i@example.com', country: 'IN', timezone: 'Asia/Kolkata', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2021-11-12'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=35', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p22',
      bio: 'Android engineer at Flipkart. Expert in Jetpack Compose, Kotlin Coroutines, and MVVM architecture.',
      areasOfExpertise: ['Mobile Development', 'Backend Development'],
      skills: ['Kotlin', 'Jetpack Compose', 'Android SDK', 'Coroutines', 'Room'],
      sessionRate: 105, yearsOfExperience: 8, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.7, reviewCount: 77, availability: 'this_week' },
    } as any],
  },
  {
    id: '23',
    firstName: 'Felix', middleName: null, lastName: 'Müller', suffix: null,
    email: 'felix@example.com', country: 'DE', timezone: 'Europe/Berlin', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2020-07-08'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=64', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p23',
      bio: 'DevOps lead at Siemens. Specialises in Kubernetes, Terraform, and building internal developer platforms.',
      areasOfExpertise: ['DevOps & Cloud', 'Backend Development'],
      skills: ['Kubernetes', 'Terraform', 'AWS', 'Helm', 'Go'],
      sessionRate: 170, yearsOfExperience: 13, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.8, reviewCount: 155, availability: 'this_month' },
    } as any],
  },
  {
    id: '24',
    firstName: 'Catalina', middleName: null, lastName: 'Ruiz', suffix: null,
    email: 'catalina@example.com', country: 'CO', timezone: 'America/Bogota', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2023-09-22'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=27', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p24',
      bio: 'Data engineer at Rappi. Mentors on Apache Spark, dbt, and building reliable data pipelines at scale.',
      areasOfExpertise: ['Data & AI', 'Backend Development'],
      skills: ['Python', 'Apache Spark', 'dbt', 'Airflow', 'BigQuery'],
      sessionRate: 120, yearsOfExperience: 6, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 4.6, reviewCount: 43, availability: 'today' },
    } as any],
  },
  {
    id: '25',
    firstName: 'Tobias', middleName: null, lastName: 'Lindqvist', suffix: null,
    email: 'tobias@example.com', country: 'SE', timezone: 'Europe/Stockholm', language: 'en',
    isMentorApproved: true, isMentorProfileComplete: true, createdAt: new Date('2022-10-03'),
    avatarAttachments: [{ publicUrl: 'https://i.pravatar.cc/150?img=66', fileName: 'avatar.jpg' }],
    mentorProfiles: [{
      id: 'p25',
      bio: 'Rust and WebAssembly engineer at Ericsson. Coaches on systems programming and WASM for the browser.',
      areasOfExpertise: ['Backend Development', 'Frontend Development'],
      skills: ['Rust', 'WebAssembly', 'TypeScript', 'C++', 'Linux'],
      sessionRate: 180, yearsOfExperience: 12, linkedInUrl: null, updatedAt: new Date(),
      ...{ rating: 5.0, reviewCount: 34, availability: 'this_week' },
    } as any],
  },
];

function mockSearch(filters: MentorSearchFilter): MentorSearchResultInterface {
  let results = [...DUMMY_RESULTS];

  if (filters.name?.trim()) {
    const q = filters.name.trim().toLowerCase();
    results = results.filter(m =>
      [m.firstName, m.lastName].join(' ').toLowerCase().includes(q)
    );
  }

  if (filters.skills.length)
    results = results.filter(m =>
      filters.skills.every(s => m.mentorProfiles[0]?.skills.includes(s))
    );

  if (filters.expertise.length)
    results = results.filter(m =>
      filters.expertise.some(e => m.mentorProfiles[0]?.areasOfExpertise.includes(e))
    );

  if (filters.minRating != null)
    results = results.filter(m => ((m.mentorProfiles[0] as any)?.rating ?? 0) >= filters.minRating!);

  if (filters.availability != null) {
    const order: Record<AvailabilityOption, number> = { today: 1, this_week: 2, this_month: 3 };
    const limit = order[filters.availability];
    results = results.filter(m => order[(m.mentorProfiles[0] as any)?.availability as AvailabilityOption] <= limit);
  }

  if (filters.minSessionRate != null)
    results = results.filter(m => (m.mentorProfiles[0]?.sessionRate ?? 0) >= filters.minSessionRate!);

  if (filters.maxSessionRate != null)
    results = results.filter(m => (m.mentorProfiles[0]?.sessionRate ?? Infinity) <= filters.maxSessionRate!);

  if (filters.minYearsExperience != null)
    results = results.filter(m => (m.mentorProfiles[0]?.yearsOfExperience ?? 0) >= filters.minYearsExperience!);

  const dir = filters.sortOrder === SearchSortOrder.ASC ? 1 : -1;
  switch (filters.sortBy) {
    case SearchSortBy.NAME:
      results.sort((a, b) => a.lastName.localeCompare(b.lastName) * dir); break;
    case SearchSortBy.SESSION_RATE:
      results.sort((a, b) => ((a.mentorProfiles[0]?.sessionRate ?? 0) - (b.mentorProfiles[0]?.sessionRate ?? 0)) * dir); break;
    case SearchSortBy.YEARS_EXPERIENCE:
      results.sort((a, b) => ((a.mentorProfiles[0]?.yearsOfExperience ?? 0) - (b.mentorProfiles[0]?.yearsOfExperience ?? 0)) * dir); break;
    default:
      results.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * dir);
  }

  const start = (filters.page - 1) * filters.limit;
  return { total: results.length, page: filters.page, limit: filters.limit, results: results.slice(start, start + filters.limit) };
}

// Flip to true when the real API is ready
const USE_REAL_API = false;

@Component({
  selector: 'app-find-mentors',
  imports: [CommonModule, MentorSearch, Pagination, MentorCard],
  templateUrl: './find-mentors.html',
  styleUrl: './find-mentors.scss',
})
export class FindMentors implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mentorSvc = inject(MentorSearchService);
  private readonly destroyRef = inject(DestroyRef);

  cards = signal<FlatMentorCard[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  isLoading = signal(false);
  hasSearched = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(params => {
        if (Object.keys(params).length === 0) return [];

        const filters = this.buildFiltersFromParams(params);
        this.isLoading.set(true);
        this.hasSearched.set(true);
        this.error.set(null);

        const search$ = USE_REAL_API
          ? this.mentorSvc.searchMentors(filters)
          : of(mockSearch(filters)).pipe(delay(400));

        return search$.pipe(
          catchError(err => {
            this.error.set(err.message);
            this.isLoading.set(false);
            return [];
          })
        );
      })
    ).subscribe((response: MentorSearchResultInterface) => {
      this.cards.set(response.results.map(toFlatCard));
      this.totalCount.set(response.total);
      this.currentPage.set(response.page);
      this.pageSize.set(response.limit);
      this.isLoading.set(false);
    });
  }

  onPageChange(page: number): void {
    if (page === this.currentPage()) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  private buildFiltersFromParams(params: Record<string, any>): MentorSearchFilter {
    const page = this.parsePositiveNumber(params['page'], 1);
    const limit = this.parsePositiveNumber(params['limit'], 10);

    return {
      name: params['name'] || null,
      skills: params['skills'] ? params['skills'].split(',').filter(Boolean) : [],
      expertise: params['expertise'] ? params['expertise'].split(',').filter(Boolean) : [],
      minRating: params['minRating'] != null ? Number(params['minRating']) : null,
      availability: (params['availability'] as AvailabilityOption) || null,
      minSessionRate: params['minSessionRate'] != null ? Number(params['minSessionRate']) : null,
      maxSessionRate: params['maxSessionRate'] != null ? Number(params['maxSessionRate']) : null,
      minYearsExperience: params['minYearsExperience'] != null ? Number(params['minYearsExperience']) : null,
      sortBy: (params['sortBy'] as SearchSortBy) || null,
      sortOrder: (params['sortOrder'] as SearchSortOrder) || SearchSortOrder.DESC,
      page,
      limit,
    };
  }

  private parsePositiveNumber(value: unknown, fallback: number): number {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue) || parsedValue < 1) {
      return fallback;
    }

    return Math.floor(parsedValue);
  }
}
