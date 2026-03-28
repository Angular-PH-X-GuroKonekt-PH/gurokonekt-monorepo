import { Component, input, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserInterface } from '@gurokonekt/models';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-user-profile-card',
  imports: [RouterLink, IconComponent],
  templateUrl: './user-profile-card.html',
  styleUrl: './user-profile-card.scss',
})
export class UserProfileCard {

   userProfile = input.required<UserInterface>();

}