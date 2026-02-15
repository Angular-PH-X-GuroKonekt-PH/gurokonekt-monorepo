export type Role = 'mentee' | 'mentor';

export interface Step {
  title: string;
  description: string;
  fields: string[];
}