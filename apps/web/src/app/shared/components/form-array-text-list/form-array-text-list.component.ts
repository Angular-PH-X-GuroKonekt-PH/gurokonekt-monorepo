import { Component, inject, input } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export function createFormArrayTextControl(
  fb: FormBuilder,
  minLength = 2
): FormControl<string> {
  return fb.control('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(minLength)],
  });
}

@Component({
  selector: 'app-form-array-text-list',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './form-array-text-list.component.html',
})
export class FormArrayTextListComponent {
  private readonly fb = inject(FormBuilder);

  formArray = input.required<FormArray>();
  listId = input.required<string>();
  label = input.required<string>();
  description = input.required<string>();
  addButtonLabel = input.required<string>();
  itemSingularLabel = input.required<string>();
  placeholder = input<string>('');
  helperText = input<string>('');
  maxItems = input.required<number>();
  minLength = input<number>(2);
  required = input<boolean>(true);

  addItem(focusNew = false): void {
    const array = this.formArray();
    if (array.length >= this.maxItems()) {
      return;
    }

    array.push(createFormArrayTextControl(this.fb, this.minLength()));

    if (focusNew) {
      this.focusItemInput(array.length - 1);
    }
  }

  removeItem(index: number): void {
    const array = this.formArray();
    if (array.length <= 1) {
      return;
    }

    array.removeAt(index);
  }

  onAddItemClick(index: number): void {
    if (!this.canAddFromIndex(index)) {
      return;
    }

    this.addItem(true);
  }

  onItemEnter(index: number, event: Event): void {
    event.preventDefault();

    if (!this.canAddFromIndex(index)) {
      return;
    }

    if (index === this.formArray().length - 1 && this.formArray().length < this.maxItems()) {
      this.addItem(true);
    }
  }

  private canAddFromIndex(index: number): boolean {
    const control = this.formArray().at(index);
    const value = control?.value?.trim() ?? '';
    if (!control || value.length < this.minLength()) {
      control?.markAsTouched();
      return false;
    }

    return true;
  }

  private focusItemInput(index: number): void {
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        `[data-form-array-text-input="${this.listId()}-${index}"]`
      );
      input?.focus();
    });
  }
}
