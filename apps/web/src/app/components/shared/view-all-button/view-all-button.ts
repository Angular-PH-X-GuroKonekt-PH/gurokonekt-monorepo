import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from "../icon/icon.component";

@Component({
  selector: 'app-view-all-button',
  imports: [RouterLink, IconComponent],
  templateUrl: './view-all-button.html',
  styleUrl: './view-all-button.scss',
})
export class ViewAllButton {
  label = input<string>('View all');
  link = input<string>();
}
