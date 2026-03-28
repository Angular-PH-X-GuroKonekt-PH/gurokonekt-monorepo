import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { BookingSessionCardInterface } from '@gurokonekt/models';
import { StarRating } from '../star-rating/star-rating';
import { IconComponent } from '../icon/icon.component';
import { SessionBadge } from "../session-badge/session-badge";

@Component({
  selector: 'app-session-history-card',
  imports: [CommonModule, StarRating, IconComponent, SessionBadge],
  templateUrl: './session-history-card.html',
  styleUrl: './session-history-card.scss',
})
export class SessionHistoryCard {

  completedSessions = input.required<BookingSessionCardInterface[]>()

}
