export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'] as const;

export const ALLOWED_DOCUMENT_ACCEPT =
  '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg';

export const DOCUMENT_TYPE_ERROR = 'Only PDF, PNG, and JPEG documents are allowed';

export type DocumentValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function isAllowedDocumentType(file: File): boolean {
  if (file.type) {
    return (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type);
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(extension);
}

export function validateDocumentFile(
  file: File,
  maxSizeBytes: number
): DocumentValidationResult {
  if (!isAllowedDocumentType(file)) {
    return { valid: false, error: DOCUMENT_TYPE_ERROR };
  }

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `Each document must be less than ${maxMb}MB`,
    };
  }

  return { valid: true };
}
