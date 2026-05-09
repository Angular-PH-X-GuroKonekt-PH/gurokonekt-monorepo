import { Component } from '@angular/core';
import { MentorNavbar } from "../../shared/navbar/mentor-navbar/mentor-navbar";
import { RouterOutlet } from "@angular/router";
import { ToastContainerComponent } from "../../shared/components/toast/toast.component";
import { MentorSidebar } from "../../shared/sidebars/mentor-sidebar/mentor-sidebar";

@Component({
  selector: 'app-mentor-layout',
  imports: [MentorNavbar, RouterOutlet, ToastContainerComponent, MentorSidebar],
  templateUrl: './mentor-layout.html',
  styleUrl: './mentor-layout.scss',
})
export class MentorLayout {}
