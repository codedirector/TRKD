import type { Resume, User } from '../types';

/**
 * Standardized URL helpers for Trackd documents and sharing
 */

export function getCleanUsername(userOrName?: User | string | null): string {
  if (!userOrName) return 'user';
  const raw = typeof userOrName === 'string' ? userOrName : userOrName.username || userOrName._id;
  return raw.replace(/^@/, '').trim();
}

/**
 * Returns the public relative path for a document
 * Preferred format: /@username/slug or /view/shareToken
 */
export function getDocumentRelativePath(resume: { slug?: string; shareToken?: string }, username?: string): string {
  const cleanUser = getCleanUsername(username);
  if (cleanUser && resume.slug) {
    return `/@${cleanUser}/${resume.slug}`;
  }
  if (resume.shareToken) {
    return `/view/${resume.shareToken}`;
  }
  if (resume.slug) {
    return `/${resume.slug}`;
  }
  return '/';
}

/**
 * Returns the full functional URL for the document (for QR code, copying to clipboard, opening in new tab)
 */
export function getDocumentPublicUrl(
  resume: { slug?: string; shareToken?: string },
  username?: string,
  options?: { preferToken?: boolean }
): string {
  const origin = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://trackd.app';

  if (options?.preferToken && resume.shareToken) {
    return `${origin}/view/${resume.shareToken}`;
  }

  const path = getDocumentRelativePath(resume, username);
  return `${origin}${path}`;
}

/**
 * Returns the clean branded display URL (e.g. trackd.app/@alex/resume)
 */
export function getDocumentDisplayUrl(resume: { slug?: string; shareToken?: string }, username?: string): string {
  const path = getDocumentRelativePath(resume, username);
  const host = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
    ? window.location.host
    : 'trackd.app';
  return `${host}${path}`;
}
