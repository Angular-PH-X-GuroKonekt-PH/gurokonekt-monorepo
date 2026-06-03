import { Component } from '@angular/core';
import { BookingTableComponent } from '../../components/booking-table/booking-table';

@Component({
  selector: 'app-booking-management-page',
  imports: [BookingTableComponent],
  templateUrl: './booking-management.page.html',
})
export class BookingManagementPage {}
