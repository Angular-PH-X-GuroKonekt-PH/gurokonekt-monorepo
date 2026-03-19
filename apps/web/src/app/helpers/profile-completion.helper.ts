export const normalizeRole = (role?: string): string => role?.toLowerCase().trim() ?? '';

export const requiresProfileSetup = (role?: string, isProfileComplete?: boolean): boolean => {
  return normalizeRole(role) === 'mentee' && isProfileComplete === false;
};
