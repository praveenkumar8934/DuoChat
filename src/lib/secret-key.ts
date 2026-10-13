/**
 * Secret Key Utilities for DuoChat Instant Login
 */

const SECRET_KEY_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a suggested random 16-character alphanumeric secret key with DUO-SEC- prefix
 * Format: DUO-SEC-XXXX-XXXX-XXXX-XXXX
 */
export function generateSecretKey(): string {
  let raw = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 16; i++) {
      raw += SECRET_KEY_CHARS.charAt(bytes[i] % SECRET_KEY_CHARS.length);
    }
  } else {
    for (let i = 0; i < 16; i++) {
      raw += SECRET_KEY_CHARS.charAt(Math.floor(Math.random() * SECRET_KEY_CHARS.length));
    }
  }

  const parts = raw.match(/.{1,4}/g) || [raw];
  return `DUO-SEC-${parts.join('-')}`;
}

/**
 * Normalizes user input secret key.
 * If 16 alphanumeric characters without dashes, formats with DUO-SEC- prefix.
 * Otherwise trims whitespace.
 */
export function normalizeSecretKey(input?: string | null): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Check if it fits the 16-char random pattern
  let cleanAlphanumeric = trimmed.toUpperCase().replace(/\s+/g, '');
  cleanAlphanumeric = cleanAlphanumeric.replace(/^(DUO[-_]?SEC[-_]?)/i, '').replace(/[^A-Z0-9]/g, '');

  if (cleanAlphanumeric.length === 16) {
    const parts = cleanAlphanumeric.match(/.{1,4}/g) || [cleanAlphanumeric];
    return `DUO-SEC-${parts.join('-')}`;
  }

  return trimmed;
}

/**
 * Validates if secret key is valid (between 4 and 64 characters)
 */
export function isValidSecretKeyFormat(input?: string | null): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  return trimmed.length >= 4 && trimmed.length <= 64;
}
