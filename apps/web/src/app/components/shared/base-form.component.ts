import { FormGroup } from '@angular/forms';
import { FormValidationHelper } from '../../helpers/form-validation.helper';

/**
 * Base class for form components providing common validation methods
 */
export abstract class BaseFormComponent {
  
  /**
   * The form instance - must be implemented by child classes
   */
  protected abstract readonly form: FormGroup;

  /**
   * Get error message for a form field
   */
  protected getErrorMessage(fieldName: string): string {
    return FormValidationHelper.getErrorMessage(this.form, fieldName);
  }

  /**
   * Check if a form field has errors
   */
  protected hasError(fieldName: string): boolean {
    return FormValidationHelper.hasError(this.form, fieldName);
  }

  /**
   * Get direct error message from field errors (without form context)
   */
  protected getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors) {
      return '';
    }
    return FormValidationHelper.mapErrorToMessage(fieldName, control.errors);
  }
}