import { Component } from '@angular/core';
import { MentorTableComponent } from '../../components/mentor-table/mentor-table';

@Component({
  selector: 'app-mentor-management-page',
  imports: [MentorTableComponent],
  templateUrl: './mentor-management.page.html',
})
export class MentorManagementPage {}
