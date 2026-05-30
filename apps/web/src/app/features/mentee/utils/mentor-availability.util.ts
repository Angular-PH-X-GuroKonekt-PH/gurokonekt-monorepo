export function formatTimeTo12Hour(time: string): string {
  const [hourValue, minute] = time.split(':');
  const hour = Number(hourValue);

  if (!Number.isFinite(hour) || !minute) {
    return time;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;

  return `${normalizedHour}:${minute} ${period}`;
}

export function formatAvailabilityLabel(
  day: string,
  from: string,
  to: string
): string {
  return `${formatDayLabel(day)}, ${formatTimeTo12Hour(from)} - ${formatTimeTo12Hour(to)}`;
}

export function formatDayLabel(day: string): string {
  return capitalize(day);
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}
