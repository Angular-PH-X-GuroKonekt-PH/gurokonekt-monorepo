import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import type {
  MentorProfile,
} from '@gurokonekt/models';
import {
  ASSIGNED_MENTOR,
  CURRENT_MENTEE_NAME,

} from 'lib/models/src/lib/dashboard.data';

/**
 * Dashboard component for the mentorship platform.
 * Displays statistics, mentorship requests, recommended mentors, and upcoming sessions.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly menteeName = CURRENT_MENTEE_NAME;
  protected readonly assignedMentor: MentorProfile = ASSIGNED_MENTOR;

  // Mock data for now - replace with real API calls
  protected readonly programProgress = {
    phase: 'Skill-Building' as const,
    percentage: 65,
    startDate: 'Oct 15, 2025',
    endDate: 'Apr 15, 2026',
    milestonesCompleted: 13,
    totalMilestones: 20,
  };
  /**
   * Accepts a mentorship request.
   * @param id - The unique identifier of the request to accept
   */
  protected accept(id: string): void {
    console.log('Accept request', id);
    // TODO: Implement acceptance logic with service
  }

  /**
   * Rejects a mentorship request.
   * @param id - The unique identifier of the request to reject
   */
  protected reject(id: string): void {
    console.log('Reject request', id);
    // TODO: Implement rejection logic with service
  }

  /**
   * Navigates to the mentor's profile.
   * @param id - The unique identifier of the mentor
   */
  protected viewMentor(id: string): void {
    console.log('View mentor', id);
    // TODO: Implement navigation to mentor profile
  }

  protected markMessageRead(id: string): void {
    console.log('Mark message as read', id);
    // TODO: Integrate with messaging service
  }

  protected openResource(url: string): void {
    console.log('Open resource', url);
    // TODO: Route or open resource viewer
  }

  protected rateSession(promptId: string, score: number): void {
    console.log('Submit feedback', promptId, score);
    // TODO: Persist rating
  }

  protected executeAction(actionId: string): void {
    console.log('Execute action', actionId);
    // TODO: Navigate to action or trigger workflow
  }

  protected joinSession(sessionId: string): void {
    console.log('Join session', sessionId);
    // TODO: Open video call link
  }

  protected addToCalendar(sessionId: string): void {
    console.log('Add to calendar', sessionId);
    // TODO: Generate calendar invite
  }

  protected viewSessionHistory(sessionId: string): void {
    console.log('View session details', sessionId);
    // TODO: Show session detail modal
  }
}
