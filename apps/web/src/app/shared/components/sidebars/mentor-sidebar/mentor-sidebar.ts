import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngxs/store';
import { IconComponent } from '../../icon/icon.component';
import * as AuthActions from '../../../../core/auth/store/auth.actions';

@Component({
  selector: 'app-mentor-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './mentor-sidebar.html',
  styleUrl: './mentor-sidebar.scss',
})
export class MentorSidebar {
  private readonly store = inject(Store);

  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }  
}
