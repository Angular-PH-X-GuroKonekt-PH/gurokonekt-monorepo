import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Datepicker } from 'flowbite';

@Component({
  selector: 'app-week-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './week-picker.html',
})
export class WeekPicker implements AfterViewInit, OnDestroy {
  @ViewChild('datepickerInput') datepickerInput?: ElementRef<HTMLInputElement>;

  value = input<string>(this.toWeekInputValue(new Date()));
  valueChange = output<string>();

  displayValue = '';

  datepicker: Datepicker | null = null;
  selectedWeek = { start: 0, end: 0 };

  isPickerOpen = false;

  handleChangeDate = (): void => this.onDatepickerChange();
  handlePickerClick = (): void => this.queueWeekHighlight();
  handlePickerShow = (): void => {
    this.isPickerOpen = true;
    if (this.picker) {
      this.picker.style.marginTop = '-16px';
    }
  };
  handlePickerHide = (): void => { this.isPickerOpen = false; };

  weekHighlightClasses = [
    'bg-orange-100',
    'text-orange-800',
    'rounded-none',
    'rounded-s-lg',
    'rounded-e-lg',
    'bg-orange-500',
    'text-white',
  ];

  constructor() {
    effect(() => this.syncDisplayedRange(this.value()));
  }

  ngAfterViewInit(): void {
    if (!this.input) return;

    this.datepicker = new Datepicker(this.input, {
      autohide: true,
      format: 'mm/dd/yyyy',
      orientation: 'bottom',
    });

    this.input.addEventListener('changeDate', this.handleChangeDate);
    this.input.addEventListener('show', this.handlePickerShow);
    this.input.addEventListener('hide', this.handlePickerHide);
    this.picker?.addEventListener('click', this.handlePickerClick);

    this.syncDisplayedRange(this.value());
  }

  ngOnDestroy(): void {
    this.input?.removeEventListener('changeDate', this.handleChangeDate);
    this.input?.removeEventListener('show', this.handlePickerShow);
    this.input?.removeEventListener('hide', this.handlePickerHide);
    this.picker?.removeEventListener('click', this.handlePickerClick);
    this.datepicker?.destroyAndRemoveInstance();
  }

  openPicker(): void {
    this.datepicker?.show();
    this.queueWeekHighlight();
  }

  onDatepickerChange(): void {
    if (!this.input) return;

    const pickedDate = this.parseFlowbiteDateValue(this.input.value);
    if (!pickedDate) return;

    const weekValue = this.toWeekInputValue(pickedDate);

    this.valueChange.emit(weekValue);
    this.syncDisplayedRange(weekValue);
  }

  syncDisplayedRange(weekValue: string): void {
    if (!this.input) return;

    const start = this.getWeekStartFromWeekValue(weekValue);
    const end = this.addDays(start, 6);
    const flowbiteValue = this.toFlowbiteDateValue(start);

    this.selectedWeek = {
      start: start.getTime(),
      end: end.getTime(),
    };

    this.input.value = flowbiteValue;
    this.datepicker?.setDate(flowbiteValue);
    this.displayValue = `${this.formatDateLabel(start)} - ${this.formatDateLabel(end)}`;

    this.queueWeekHighlight();
  }

  queueWeekHighlight(): void {
    requestAnimationFrame(() => this.highlightSelectedWeek());
  }

  highlightSelectedWeek(): void {
    const cells = this.picker?.querySelectorAll<HTMLElement>('.datepicker-cell.day');
    if (!cells?.length) return;

    cells.forEach((cell) => {
      cell.classList.remove(...this.weekHighlightClasses);

      const cellTime = Number(cell.dataset['date']);
      if (!this.isSelectedWeekDay(cellTime)) return;

      cell.classList.add('bg-orange-100', 'text-orange-800', 'rounded-none');

      if (cellTime === this.selectedWeek.start) {
        cell.classList.add('rounded-s-lg', 'bg-orange-500', 'text-white');
      }

      if (cellTime === this.selectedWeek.end) {
        cell.classList.add('rounded-e-lg');
      }
    });
  }

  get input(): HTMLInputElement | undefined {
    return this.datepickerInput?.nativeElement;
  }

  get picker(): HTMLElement | null {
    const instance = this.datepicker?.getDatepickerInstance() as | { pickerElement?: HTMLElement } | undefined;
    return instance?.pickerElement ?? null;
  }

  isSelectedWeekDay(time: number): boolean {
    return (
      Number.isFinite(time) &&
      time >= this.selectedWeek.start &&
      time <= this.selectedWeek.end
    );
  }

  addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  parseFlowbiteDateValue(value: string): Date | null {
    const [month, day, year] = value.split('/').map(Number);
    return month && day && year ? new Date(year, month - 1, day) : null;
  }

  toFlowbiteDateValue(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${month}/${day}/${date.getFullYear()}`;
  }

  getWeekStartFromWeekValue(weekValue: string): Date {
    const [yearText, weekText] = weekValue.split('-W');
    const year = Number(yearText);
    const week = Number(weekText);

    const firstDay = new Date(year, 0, 1).getDay() || 7;
    const monday = new Date(year, 0, 1 + (week - 1) * 7);

    monday.setDate(
      firstDay <= 4
        ? monday.getDate() - firstDay + 1
        : monday.getDate() + 8 - firstDay
    );

    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  toWeekInputValue(date: Date): string {
    const target = new Date(date);

    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));

    const weekOne = new Date(target.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((target.getTime() - weekOne.getTime()) / 86400000 - 3 + ((weekOne.getDay() + 6) % 7)) / 7);

    return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }

  formatDateLabel(date: Date): string {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}