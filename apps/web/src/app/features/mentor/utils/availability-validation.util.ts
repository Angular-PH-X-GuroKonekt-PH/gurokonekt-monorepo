import type { TimeFrameInterface } from '@gurokonekt/models/interfaces/user/user.model';

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function splitAvailabilityFrame(
  frame: TimeFrameInterface,
  sessionDurationMinutes: number
): TimeFrameInterface[] {
  const start = timeToMinutes(frame.from);
  const end = timeToMinutes(frame.to);
  const duration = end - start;

  if (
    sessionDurationMinutes <= 0 ||
    duration < sessionDurationMinutes ||
    duration % sessionDurationMinutes !== 0
  ) {
    return [{ ...frame }];
  }

  const sessionFrames: TimeFrameInterface[] = [];

  for (
    let sessionStart = start;
    sessionStart < end;
    sessionStart += sessionDurationMinutes
  ) {
    sessionFrames.push({
      from: minutesToTime(sessionStart),
      to: minutesToTime(sessionStart + sessionDurationMinutes),
    });
  }

  return sessionFrames;
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
