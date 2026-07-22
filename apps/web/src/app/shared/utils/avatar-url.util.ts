type AvatarAttachmentLike = { publicUrl?: string | null };

/**
 * Resolve the avatar public URL from a profile payload.
 * When multiple attachments exist (legacy uploads), prefer the last entry.
 */
export function resolveAvatarPublicUrl(
  profileData:
    | {
        avatarAttachments?: AvatarAttachmentLike[] | AvatarAttachmentLike | null;
        user?: { avatarAttachments?: AvatarAttachmentLike[] | AvatarAttachmentLike | null };
      }
    | null
    | undefined,
  fallback = 'assets/img/no_profile_avatar.png'
): string {
  const attachments =
    normalizeAvatarAttachments(profileData?.avatarAttachments) ??
    normalizeAvatarAttachments(profileData?.user?.avatarAttachments);

  if (!attachments?.length) {
    return fallback;
  }

  const publicUrl = attachments[attachments.length - 1]?.publicUrl;
  return publicUrl?.trim() || fallback;
}

function normalizeAvatarAttachments(
  value: AvatarAttachmentLike[] | AvatarAttachmentLike | null | undefined
): AvatarAttachmentLike[] | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}
