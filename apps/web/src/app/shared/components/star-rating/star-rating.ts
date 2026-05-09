import { Component, input } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  imports: [],
  templateUrl: './star-rating.html',
})
export class StarRating {
  rating = input.required<number | null>();

}
