export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;

export type AvatarValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateAvatarFile(file: File): AvatarValidationResult {
  if (!(ALLOWED_AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return { valid: false, error: 'Only JPG, JPEG, and PNG formats are allowed' };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error('Failed to read file'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
