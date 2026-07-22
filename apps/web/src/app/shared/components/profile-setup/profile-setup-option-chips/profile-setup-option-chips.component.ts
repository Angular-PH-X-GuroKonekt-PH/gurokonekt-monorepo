import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-profile-setup-option-chips',
  standalone: true,
  templateUrl: './profile-setup-option-chips.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ProfileSetupOptionChipsComponent {
  readonly label = input.required<string>();
  readonly description = input.required<string>();
  readonly options = input.required<string[]>();
  readonly selectedCount = input.required<number>();
  readonly maxItems = input<number | null>(null);
  readonly emptyError = input('Please select at least one option');
  readonly showSelectedCount = input(true);
  readonly isSelected = input.required<(option: string) => boolean>();

  readonly toggled = output<string>();

  protected isDisabled(option: string): boolean {
    const max = this.maxItems();
    if (max === null) {
      return false;
    }
    return !this.isSelected()(option) && this.selectedCount() >= max;
  }
}
