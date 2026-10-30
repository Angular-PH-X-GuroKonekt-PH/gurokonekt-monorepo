import { Component, viewChild } from '@angular/core';
import { MentorTableComponent } from '../../components/mentor-table/mentor-table';
import { ReactivationRequestsComponent } from '../../components/reactivation-requests/reactivation-requests';

@Component({
  selector: 'app-mentor-management-page',
  imports: [MentorTableComponent, ReactivationRequestsComponent],
  templateUrl: './mentor-management.page.html',
})
export class MentorManagementPage {
  private readonly table = viewChild(MentorTableComponent);

  protected refreshTable(): void {
    this.table()?.loadMentors();
  }
}
