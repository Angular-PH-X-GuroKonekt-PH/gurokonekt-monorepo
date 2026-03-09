import { Component, afterNextRender } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    afterNextRender(() => {
      import('flowbite').then(({ initFlowbite }) => initFlowbite());
    });
  }
}