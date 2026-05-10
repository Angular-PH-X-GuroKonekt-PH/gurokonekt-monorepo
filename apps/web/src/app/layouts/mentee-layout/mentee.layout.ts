import { Component } from '@angular/core';
import { ToastContainerComponent } from "../../shared/components/toast/toast.component";
import {RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenteeNavbar } from '../components/navbar/mentee-navbar/mentee-navbar.component';
import { MenteeSidebar } from '../components/sidebars/mentee-sidebar/mentee-sidebar.component';

@Component({
  selector: 'app-mentee-layout',
  imports: [ToastContainerComponent,RouterOutlet, MenteeNavbar, MenteeSidebar, CommonModule],
  templateUrl: './mentee.layout.html',
  styleUrl: './mentee.layout.scss',
})
export class MenteeLayout {

  
}
