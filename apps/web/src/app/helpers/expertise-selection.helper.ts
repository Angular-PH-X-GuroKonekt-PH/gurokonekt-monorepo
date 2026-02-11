import { FormGroup } from '@angular/forms';
import { EXPERTISE_OPTIONS } from '../constants/expertise.constants';

/**
 * Helper for managing expertise selection in forms
 */
export class ExpertiseSelectionHelper {
  
  /**
   * Standard expertise options for mentor registration
   */
  static readonly EXPERTISE_OPTIONS = EXPERTISE_OPTIONS;

  /**
   * Handle expertise checkbox change
   */
  static handleExpertiseChange(
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
  static isExpertiseSelected(
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
  static getSelectedExpertiseCount(
    form: FormGroup,
    fieldName = 'areasOfExpertise'
  ): number {
    const currentAreas = form.get(fieldName)?.value || [];
    return currentAreas.length;
  }

  /**
   * Validate minimum expertise selection
   */
  static validateMinimumExpertise(
    form: FormGroup,
    minCount = 1,
    fieldName = 'areasOfExpertise'
  ): boolean {
    return ExpertiseSelectionHelper.getSelectedExpertiseCount(form, fieldName) >= minCount;
  }
}