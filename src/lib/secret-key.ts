/**
 * Secret Key Utilities for DuoChat Instant Login
 */

const SECRET_KEY_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a random 16-character alphanumeric secret key with DUO-SEC- prefix
 * Format: DUO-SEC-XXXX-XXXX-XXXX-XXXX
 */
export function generateSecretKey(): string {
  let raw = '';
  // Cryptographically secure random bytes if available in runtime
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
 * Normalizes user input secret key into standard DUO-SEC-XXXX-XXXX-XXXX-XXXX format
 */
export function normalizeSecretKey(input?: string | null): string {
  if (!input) return '';
  let clean = input.trim().toUpperCase().replace(/\s+/g, '');
  // Remove optional DUO-SEC or DUOSEC prefix
  clean = clean.replace(/^(DUO[-_]?SEC[-_]?)/i, '');
  // Strip non-alphanumeric chars
  clean = clean.replace(/[^A-Z0-9]/g, '');

  if (clean.length === 16) {
    const parts = clean.match(/.{1,4}/g) || [clean];
    return `DUO-SEC-${parts.join('-')}`;
  }

  return input.trim().toUpperCase();
}

/**
 * Validates if input matches standard Secret Key format
 */
export function isValidSecretKeyFormat(input?: string | null): boolean {
  if (!input) return false;
  const normalized = normalizeSecretKey(input);
  return /^DUO-SEC-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(
    normalized
  );
}
