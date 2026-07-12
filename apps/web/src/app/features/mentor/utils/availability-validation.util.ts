import type { TimeFrameInterface } from '@gurokonekt/models/interfaces/user/user.model';

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function validateAvailabilityFrames(
  frames: TimeFrameInterface[],
  sessionDurationMinutes: number
): string | null {
  for (const frame of frames) {
    const start = timeToMinutes(frame.from);
    const end = timeToMinutes(frame.to);
    const duration = end - start;

    if (start >= end) {
      return 'Start time must be before end time.';
    }

    if (duration < sessionDurationMinutes) {
      return `Time range must be at least ${sessionDurationMinutes} minutes.`;
    }

    if (duration % sessionDurationMinutes !== 0) {
      return `Time range must be divisible into ${sessionDurationMinutes}-minute sessions.`;
    }
  }

  const sortedFrames = [...frames].sort(
    (first, second) =>
      timeToMinutes(first.from) - timeToMinutes(second.from)
  );
  const hasOverlap = sortedFrames.some((frame, index) => {
    const nextFrame = sortedFrames[index + 1];
    return (
      nextFrame !== undefined &&
      timeToMinutes(nextFrame.from) < timeToMinutes(frame.to)
    );
  });

  return hasOverlap
    ? 'This time slot overlaps another availability slot on the same day.'
    : null;
}
