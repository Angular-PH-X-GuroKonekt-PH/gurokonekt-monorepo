import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { BookingSessionCardInterface } from '@gurokonekt/models';
import { StarRating } from '../../../../shared/components/star-rating/star-rating';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SessionBadge } from 'apps/web/src/app/shared/components/session-badge/session-badge';


@Component({
  selector: 'app-session-history-card',
  imports: [CommonModule, StarRating, IconComponent, SessionBadge],
  templateUrl: './session-history-card.html',
  styleUrl: './session-history-card.scss',
})
export class SessionHistoryCard {

  completedSessions = input.required<BookingSessionCardInterface[]>()

}
