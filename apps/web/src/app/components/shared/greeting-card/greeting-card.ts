import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-greeting-card',
  imports: [RouterLink],
  templateUrl: './greeting-card.html',
  styleUrl: './greeting-card.scss',
})
export class GreetingCard {
  name = input<string>('Mentee');
}
