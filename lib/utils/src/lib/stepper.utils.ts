/**
 * Step configuration interface
 */
export interface Step {
  title: string;
  description: string;
}

/**
 * Generic form interface (framework-agnostic)
 */
export interface GenericForm {
  get(fieldName: string): any;
  hasError(errorType: string): boolean;
  controls: { [key: string]: any };
}

/**
 * Step validation function type
 */
export type StepValidator = (form: GenericForm) => boolean;

/**
 * Multi-step form utilities (framework-agnostic)
 */
export class StepperUtils {
  /**
   * Check if user can proceed to a specific step
   */
  static canProceedToStep(
    targetStep: number,
    currentStep: number,
    form: GenericForm,
    stepValidators: { [step: number]: StepValidator }
  ): boolean {
    // Can always go to step 1
    if (targetStep === 1) return true;
    
    // Can't go to future steps beyond current + 1
    if (targetStep > currentStep + 1) return false;
    
    // For other steps, check if all previous steps are valid
    for (let i = 1; i < targetStep; i++) {
      if (!this.isStepValid(i, form, stepValidators)) return false;
    }
    
    return true;
  }

  /**
   * Check if a specific step is valid
   */
  static isStepValid(
    step: number,
    form: GenericForm,
    stepValidators: { [step: number]: StepValidator }
  ): boolean {
    const validator = stepValidators[step];
    return validator ? validator(form) : true;
  }

  /**
   * Get form completion percentage
   */
  static getFormCompletionPercentage(form: GenericForm): number {
    const controls = Object.keys(form.controls);
    const totalFields = controls.length;
    
    const completedFields = controls.filter(key => {
      const control = form.get(key);
      return control && control.valid && control.value;
    }).length;
    
    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Get step progress percentage
   */
  static getStepProgress(currentStep: number, totalSteps: number): number {
    return Math.round((currentStep / totalSteps) * 100);
  }

  /**
   * Default step validators for common registration forms
   */
  static getDefaultRegistrationStepValidators(): { [step: number]: StepValidator } {
    return {
      1: (form: GenericForm) => {
        // Personal Information
        return !!(
          form.get('firstName')?.valid && 
          form.get('lastName')?.valid && 
          form.get('email')?.valid && 
          form.get('phoneNumber')?.valid
        );
      },
      2: (form: GenericForm) => {
        // Account Security
        return !!(
          form.get('password')?.valid && 
          form.get('confirmPassword')?.valid && 
          !form.hasError('passwordMismatch')
        );
      },
      3: (form: GenericForm) => {
        // Location & Preferences
        return !!(
          form.get('country')?.valid && 
          form.get('timezone')?.valid
        );
      },
      4: (form: GenericForm) => {
        // Terms & Review
        return !!form.get('acceptTerms')?.valid;
      }
    };
  }

  /**
   * Get default registration steps configuration
   */
  static getDefaultRegistrationSteps(): Step[] {
    return [
      { title: 'Personal Info', description: 'Basic details' },
      { title: 'Security', description: 'Password setup' },
      { title: 'Location', description: 'Timezone & preferences' },
      { title: 'Review', description: 'Confirm & submit' }
    ];
  }

  /**
   * Navigate to next step if current step is valid
   */
  static navigateNext(
    currentStep: number,
    totalSteps: number,
    form: GenericForm,
    stepValidators: { [step: number]: StepValidator },
    setCurrentStep: (step: number) => void
  ): boolean {
    if (this.isStepValid(currentStep, form, stepValidators) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      return true;
    }
    return false;
  }

  /**
   * Navigate to previous step
   */
  static navigatePrevious(
    currentStep: number,
    setCurrentStep: (step: number) => void
  ): boolean {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      return true;
    }
    return false;
  }

  /**
   * Navigate to specific step if allowed
   */
  static navigateToStep(
    targetStep: number,
    currentStep: number,
    form: GenericForm,
    stepValidators: { [step: number]: StepValidator },
    setCurrentStep: (step: number) => void
  ): boolean {
    if (this.canProceedToStep(targetStep, currentStep, form, stepValidators)) {
      setCurrentStep(targetStep);
      return true;
    }
    return false;
  }
}