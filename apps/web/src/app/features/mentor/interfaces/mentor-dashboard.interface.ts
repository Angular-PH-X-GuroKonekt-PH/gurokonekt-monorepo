import { MentorDashboardInterface } from '@gurokonekt/models';

export type MentorDashboardLoadState =
  | { status: 'idle' | 'loading' | 'error'; data: null }
  | { status: 'loaded'; data: MentorDashboardInterface };
