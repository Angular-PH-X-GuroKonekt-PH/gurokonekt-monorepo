import { Component } from '@angular/core';
import { InquiryTableComponent } from '../../components/inquiry-table/inquiry-table';

@Component({
  selector: 'app-user-inquiries-page',
  imports: [InquiryTableComponent],
  templateUrl: './user-inquiries.page.html',
})
export class UserInquiriesPage {}
