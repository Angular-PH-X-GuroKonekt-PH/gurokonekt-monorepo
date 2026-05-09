export const normalizeRole = (role?: string): string => role?.toLowerCase().trim() ?? '';

export const requiresProfileSetup = (
  role?: string,
  isProfileComplete?: boolean,
  isMentorProfileComplete?: boolean
): boolean => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'mentor') {
    return isMentorProfileComplete === false;
  }

  return normalizedRole === 'mentee' && isProfileComplete === false;
};
