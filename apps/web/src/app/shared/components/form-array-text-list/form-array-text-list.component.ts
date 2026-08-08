import { Component, computed, inject, input, signal } from '@angular/core';
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
  host: { class: 'block' },
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
  /** Optional LinkedIn-style recommendations for typeahead + chips. */
  suggestions = input<readonly string[]>([]);

  protected readonly activeRowIndex = signal<number | null>(null);
  private readonly filterQuery = signal('');
  protected readonly highlightedIndex = signal(-1);
  /** Bumped when values change via chips/suggestions so available lists refresh. */
  private readonly selectionVersion = signal(0);

  protected readonly filteredSuggestions = computed(() => {
    this.selectionVersion();
    const query = this.filterQuery().trim().toLowerCase();
    return this.availableSuggestions()
      .filter((suggestion) => !query || suggestion.toLowerCase().includes(query))
      .slice(0, 8);
  });

  protected readonly chipSuggestions = computed(() => {
    this.selectionVersion();
    return this.availableSuggestions().slice(0, 8);
  });

  protected readonly showDropdown = computed(() => {
    return (
      this.activeRowIndex() !== null &&
      this.suggestions().length > 0 &&
      this.filteredSuggestions().length > 0
    );
  });

  private availableSuggestions(): string[] {
    const selected = new Set(
      (this.formArray().value as string[])
        .map((value) => value?.trim().toLowerCase())
        .filter((value): value is string => !!value)
    );

    return this.suggestions().filter(
      (suggestion) => !selected.has(suggestion.toLowerCase())
    );
  }

  addItem(focusNew = false): void {
    const array = this.formArray();
    if (array.length >= this.maxItems()) {
      return;
    }

    array.push(createFormArrayTextControl(this.fb, this.minLength()));
    this.selectionVersion.update((version) => version + 1);

    if (focusNew) {
      this.focusItemInput(array.length - 1);
    }
  }

  removeItem(index: number): void {
    const array = this.formArray();
    if (this.required() && array.length <= 1) {
      return;
    }

    array.removeAt(index);
    this.closeSuggestions();
    this.selectionVersion.update((version) => version + 1);
  }

  onAddItemClick(index: number): void {
    if (!this.canAddFromIndex(index)) {
      return;
    }

    this.addItem(true);
  }

  onItemEnter(index: number, event: Event): void {
    event.preventDefault();

    if (this.showDropdown() && this.highlightedIndex() >= 0) {
      const suggestion = this.filteredSuggestions()[this.highlightedIndex()];
      if (suggestion) {
        this.selectSuggestion(suggestion, index);
        return;
      }
    }

    if (!this.canAddFromIndex(index)) {
      return;
    }

    if (index === this.formArray().length - 1 && this.formArray().length < this.maxItems()) {
      this.addItem(true);
    }
  }

  protected onFocus(index: number): void {
    if (!this.suggestions().length) {
      return;
    }

    const value = String(this.formArray().at(index)?.value ?? '');
    this.activeRowIndex.set(index);
    this.filterQuery.set(value);
    this.highlightedIndex.set(-1);
  }

  protected onInput(index: number, event: Event): void {
    if (!this.suggestions().length) {
      return;
    }

    const value = (event.target as HTMLInputElement).value;
    this.activeRowIndex.set(index);
    this.filterQuery.set(value);
    this.highlightedIndex.set(-1);
    this.selectionVersion.update((version) => version + 1);
  }

  protected onBlur(): void {
    // Delay so suggestion mousedown can apply before the panel closes.
    setTimeout(() => this.closeSuggestions(), 120);
  }

  protected onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onItemEnter(index, event);
      return;
    }

    if (!this.suggestions().length) {
      return;
    }

    const matches = this.filteredSuggestions();

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        this.activeRowIndex.set(index);
        if (!matches.length) {
          return;
        }
        this.highlightedIndex.update((current) =>
          current < matches.length - 1 ? current + 1 : 0
        );
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (!matches.length) {
          return;
        }
        this.highlightedIndex.update((current) =>
          current > 0 ? current - 1 : matches.length - 1
        );
        break;
      }
      case 'Escape': {
        this.closeSuggestions();
        break;
      }
      default:
        break;
    }
  }

  protected selectSuggestion(suggestion: string, rowIndex: number): void {
    const control = this.formArray().at(rowIndex);
    if (!control) {
      return;
    }

    control.setValue(suggestion);
    control.markAsDirty();
    control.markAsTouched();
    this.closeSuggestions();
    this.selectionVersion.update((version) => version + 1);
  }

  protected applyChipSuggestion(suggestion: string): void {
    if (this.formArray().length >= this.maxItems() && !this.hasEmptyControl()) {
      return;
    }

    const emptyIndex = this.formArray().controls.findIndex(
      (control) => !String(control.value ?? '').trim()
    );

    if (emptyIndex >= 0) {
      this.selectSuggestion(suggestion, emptyIndex);
      return;
    }

    if (this.formArray().length >= this.maxItems()) {
      return;
    }

    const control = createFormArrayTextControl(this.fb, this.minLength());
    control.setValue(suggestion);
    this.formArray().push(control);
    this.closeSuggestions();
    this.selectionVersion.update((version) => version + 1);
  }

  protected hasEmptyControl(): boolean {
    return this.formArray().controls.some(
      (control) => !String(control.value ?? '').trim()
    );
  }

  private closeSuggestions(): void {
    this.activeRowIndex.set(null);
    this.filterQuery.set('');
    this.highlightedIndex.set(-1);
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
