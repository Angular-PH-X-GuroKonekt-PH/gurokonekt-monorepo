import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-title',
  imports: [],
  templateUrl: './section-title.html',
  styleUrl: './section-title.scss',
})
export class SectionTitle {

  title = input.required<string>();
  subtitle = input<string>();
  count = input<number | null>(null);

}
