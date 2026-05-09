import { Component, input, output } from '@angular/core';
import { BookingFilter } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-filter-button',
  imports: [],
  templateUrl: './filter-button.html',
  styleUrl: './filter-button.scss',
})
export class FilterButton {

  
  label = input.required<string>()
  value = input.required<BookingFilter>()
  selectedValue = input.required<BookingFilter>()
  count = input<number>(0);
  
  clicked = output<BookingFilter>()

  get isActive(): boolean{
    return this.selectedValue() === this.value()
  }

  onClick() {
    this.clicked.emit(this.value())
  }

}
