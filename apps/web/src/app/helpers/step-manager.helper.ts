import { signal, computed } from '@angular/core';
import { FormGroup } from '@angular/forms';

export interface Step {
  title: string;
  description: string;
  fields: string[];
}

/**
 * Reusable step management helper for multi-step forms
 */
export class StepManagerHelper {
  // Step state
  public readonly currentStep = signal(1);
  
  // Computed properties
  public readonly formCompletionPercentage = computed(() => {
    if (!this.form) return 0;
    
    const totalFields = Object.keys(this.form.controls).length;
    const completedFields = Object.keys(this.form.controls).filter(key => {
      const control = this.form!.get(key);
      return control && control.valid && control.value;
    }).length;
    
    return Math.round((completedFields / totalFields) * 100);
  });

  constructor(
    public readonly steps: Step[],
    public readonly totalSteps: number,
    private form?: FormGroup
  ) {}

  /**
   * Set the form reference after initialization
   */
  setForm(form: FormGroup): void {
    this.form = form;
  }

  /**
   * Navigate to the next step
   */
  nextStep(): void {
    if (this.isCurrentStepValid() && this.currentStep() < this.totalSteps) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  /**
   * Navigate to the previous step
   */
  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  /**
   * Navigate to a specific step
   */
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      // Only allow going to previous steps or next step if current is valid
      if (step <= this.currentStep() || (step === this.currentStep() + 1 && this.isCurrentStepValid())) {
        this.currentStep.set(step);
      }
    }
  }

  /**
   * Check if the current step is valid
   */
  isCurrentStepValid(): boolean {
    if (!this.form) return false;
    
    const currentStepConfig = this.steps[this.currentStep() - 1];
    return currentStepConfig.fields.every((fieldName: string) => {
      const control = this.form!.get(fieldName);
      return control && control.valid;
    });
  }

  /**
   * Check if user can proceed to a specific step
   */
  canProceedToStep(stepNumber: number): boolean {
    if (stepNumber === 1) return true;
    if (!this.form) return false;
    
    // Check if all previous steps are valid
    for (let i = 1; i < stepNumber; i++) {
      const stepConfig = this.steps[i - 1];
    const isStepValid = stepConfig.fields.every((fieldName: string) => {
        const control = this.form!.get(fieldName);
        return control && control.valid;
      });
      if (!isStepValid) return false;
    }
    return true;
  }

  /**
   * Check if a step is completed
   */
  isStepCompleted(stepNumber: number): boolean {
    if (!this.form) return false;
    
    const stepConfig = this.steps[stepNumber - 1];
    return stepConfig.fields.every((fieldName: string) => {
      const control = this.form!.get(fieldName);
      return control && control.valid && control.value;
    });
  }

  /**
   * Reset to first step
   */
  reset(): void {
    this.currentStep.set(1);
  }

  /**
   * Get the current step configuration
   */
  getCurrentStepConfig(): Step {
    return this.steps[this.currentStep() - 1];
  }

  /**
   * Check if current step is the first step
   */
  isFirstStep(): boolean {
    return this.currentStep() === 1;
  }

  /**
   * Check if current step is the last step
   */
  isLastStep(): boolean {
    return this.currentStep() === this.totalSteps;
  }
}