import { Component } from '@angular/core';
import { MenteeTableComponent } from '../../components/mentee-table/mentee-table';

@Component({
  selector: 'app-mentee-management-page',
  imports: [MenteeTableComponent],
  templateUrl: './mentee-management.page.html',
})
export class MenteeManagementPage {}
