import { FormArray, FormControl, FormGroup } from '@angular/forms';

/**
 * Helper for managing expertise selection in forms
 */
export class ExpertiseSelectionHelper {
  
  /**
   * Standard expertise options for mentor registration
   */
  static readonly EXPERTISE_OPTIONS = [
    'Software Engineering',
    'Frontend Development',
    'Backend Development', 
    'Full-Stack Development',
    'DevOps & Infrastructure',
    'Cloud Architecture',
    'Data Science & Analytics',
    'Machine Learning & AI',
    'Product Management',
    'UI/UX Design',
    'Cybersecurity',
    'Mobile Development',
    'Database Design',
    'System Architecture',
    'Quality Assurance',
    'Project Management'
  ];

  /**
   * Handle expertise checkbox change
   */
  static handleExpertiseChange(
    event: Event, 
    expertise: string, 
    form: FormGroup,
    fieldName = 'expertiseAreas'
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
    fieldName = 'expertiseAreas'
  ): boolean {
    const currentAreas = form.get(fieldName)?.value || [];
    return currentAreas.includes(expertise);
  }

  /**
   * Get selected expertise count
   */
  static getSelectedExpertiseCount(
    form: FormGroup,
    fieldName = 'expertiseAreas'
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
    fieldName = 'expertiseAreas'
  ): boolean {
    return ExpertiseSelectionHelper.getSelectedExpertiseCount(form, fieldName) >= minCount;
  }
}