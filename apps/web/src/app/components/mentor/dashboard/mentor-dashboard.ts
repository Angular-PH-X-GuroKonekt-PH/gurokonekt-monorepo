import { Component, signal } from '@angular/core';
import { IconComponent } from "../../shared/icon/icon.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mentor-dashboard',
  imports: [IconComponent, RouterLink],
  templateUrl: './mentor-dashboard.html',
  styleUrl: './mentor-dashboard.scss',
})
export class MentorDashboard {
  mentorName = signal('Marcus');

  pendingRequests = signal(3);
  upcomingSessions = signal(12);
  completedSessions = signal(148);

  nextSessions = signal([
    { name: 'Alex Chen', topic: 'Product Management Career Path', time: '2:00 PM', eta: 'In 45 minutes' },
    { name: 'Maria Santos', topic: 'UI/UX Design Fundamentals', time: '4:30 PM', eta: 'In 3 hours' },
    { name: 'James Reyes', topic: 'Backend Engineering with Node.js', time: '6:00 PM', eta: 'In 4.5 hours' },
  ]);  
}
