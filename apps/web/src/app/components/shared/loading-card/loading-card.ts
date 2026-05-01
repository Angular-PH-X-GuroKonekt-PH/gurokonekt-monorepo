import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-card',
  imports: [],
  templateUrl: './loading-card.html',
})
export class LoadingCard {
  message = input<string>('Loading...');
}
