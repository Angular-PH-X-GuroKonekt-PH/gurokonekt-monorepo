import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-greeting-card',
  imports: [RouterLink],
  templateUrl: './greeting-card.component.html',
})
export class GreetingCard {
  name = input<string>('Mentee');
}
