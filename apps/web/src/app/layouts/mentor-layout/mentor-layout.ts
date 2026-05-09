import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { ToastContainerComponent } from "../../shared/components/toast/toast.component";
import { MentorSidebar } from '../components/sidebars/mentor-sidebar/mentor-sidebar';
import { MentorNavbar } from '../components/navbar/mentor-navbar/mentor-navbar';

@Component({
  selector: 'app-mentor-layout',
  imports: [MentorNavbar, RouterOutlet, ToastContainerComponent, MentorSidebar],
  templateUrl: './mentor-layout.html',
})
export class MentorLayout {}
