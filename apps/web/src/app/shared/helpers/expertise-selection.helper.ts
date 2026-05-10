import { FormGroup } from '@angular/forms';
import { EXPERTISE_OPTIONS } from '../constants/expertise.constants';

/**
 * Helper for managing expertise selection in forms
 */
export const expertiseOptions = EXPERTISE_OPTIONS;

/**
 * Handle expertise checkbox change
 */
export function handleExpertiseChange(
  event: Event,
  expertise: string,
  form: FormGroup,
  fieldName = 'areasOfExpertise'
): void {
  const checkbox = event.target as HTMLInputElement;
  const currentAreas = form.get(fieldName)?.value || [];

  if (checkbox.checked) {
    if (!currentAreas.includes(expertise)) {
      currentAreas.push(expertise);
    }
  } else {
    const index = currentAreas.indexOf(expertise);
    if (index > -1) {
      currentAreas.splice(index, 1);
    }
  }

  form.patchValue({ [fieldName]: currentAreas });
}

/**
 * Check if expertise is selected
 */
export function isExpertiseSelected(
  expertise: string,
  form: FormGroup,
  fieldName = 'areasOfExpertise'
): boolean {
  const currentAreas = form.get(fieldName)?.value || [];
  return currentAreas.includes(expertise);
}

/**
 * Get selected expertise count
 */
export function getSelectedExpertiseCount(
  form: FormGroup,
  fieldName = 'areasOfExpertise'
): number {
  const currentAreas = form.get(fieldName)?.value || [];
  return currentAreas.length;
}

/**
 * Validate minimum expertise selection
 */
export function validateMinimumExpertise(
  form: FormGroup,
  minCount = 1,
  fieldName = 'areasOfExpertise'
): boolean {
  return getSelectedExpertiseCount(form, fieldName) >= minCount;
}