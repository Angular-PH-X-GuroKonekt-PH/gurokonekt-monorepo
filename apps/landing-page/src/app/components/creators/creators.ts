import { Component, inject, OnInit, signal } from '@angular/core';
import { Creator } from '@gurokonekt/models';
import { Contentful } from '../../shared/services/contentful/contentful';
@Component({
  selector: 'app-creators',
  imports: [],
  templateUrl: './creators.html',
  styleUrl: './creators.scss',
})
export class Creators implements OnInit{
  dataService = inject(Contentful);
  creatorItems = signal<Array<Creator>>([]);


  ngOnInit(): void {
    this.dataService.getLeads().then((res) => {
      this.creatorItems.set(res);
    });
  }
}
