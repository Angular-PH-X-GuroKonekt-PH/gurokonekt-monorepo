import { BaseRegistrationComponent } from './base-registration.component';
import { signal, WritableSignal } from '@angular/core';

/**
 * Base class for multi-step registration forms
 * Extends BaseRegistrationComponent with stepper functionality
 */
export abstract class BaseStepperRegistrationComponent extends BaseRegistrationComponent {
  
  protected abstract readonly totalSteps: number;
  protected abstract readonly stepTitles: string[];
  
  protected readonly currentStep: WritableSignal<number> = signal(1);
  
  protected goToStep(step: number): void {
    if (this.canNavigateToStep(step)) {
      this.currentStep.set(step);
      this.scrollToTop();
    }
  }
  
  protected nextStep(): void {
    if (this.canProceedToNextStep()) {
      this.currentStep.update(step => step + 1);
      this.scrollToTop();
    }
  }
  
  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
      this.scrollToTop();
    }
  }
  
  protected getProgress(): number {
    return Math.round((this.currentStep() / this.totalSteps) * 100);
  }
  
  protected canNavigateToStep(step: number): boolean {
    // Only allow navigation to current or previous steps, not future steps
    return step >= 1 && step <= this.currentStep() && step <= this.totalSteps;
  }
  
  protected canProceedToNextStep(): boolean {
    return this.isCurrentStepValid() && !this.isLastStep();
  }
  
  protected isCurrentStepValid(): boolean {
    return this.registerForm.valid;
  }
  
  protected isFirstStep(): boolean {
    return this.currentStep() === 1;
  }
  
  protected isLastStep(): boolean {
    return this.currentStep() === this.totalSteps;
  }
  
  protected getCurrentStepTitle(): string {
    const currentStepIndex = this.currentStep() - 1;
    return this.stepTitles[currentStepIndex] || `Step ${this.currentStep()}`;
  }
  
  protected getStepClass(step: number): string {
    const current = this.currentStep();
    if (step === current) {
      return 'current';
    } else if (step < current) {
      return 'completed';
    } else {
      return 'pending';
    }
  }
}