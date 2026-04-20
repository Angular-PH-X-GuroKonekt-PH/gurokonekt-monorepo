import { Component } from '@angular/core';
import { ToastContainerComponent } from "../../shared/toast/toast.component";
import {RouterOutlet } from '@angular/router';
import { MenteeNavbar } from "../../shared/navbar/mentee-navbar/mentee-navbar";
import { MenteeSidebar } from "../../shared/sidebars/mentee-sidebar/mentee-sidebar";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mentee-layout',
  imports: [ToastContainerComponent,RouterOutlet, MenteeNavbar, MenteeSidebar, CommonModule],
  templateUrl: './mentee-layout.html',
  styleUrl: './mentee-layout.scss',
})
export class MenteeLayout {

  
}
