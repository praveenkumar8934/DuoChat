import { describe, it, expect } from 'vitest';
import {
  generateSecretKey,
  normalizeSecretKey,
  isValidSecretKeyFormat,
} from '@/lib/secret-key';

describe('Secret Key Utilities', () => {
  it('generates a 16-character grouped secret key starting with DUO-SEC-', () => {
    const key = generateSecretKey();
    expect(key).toMatch(/^DUO-SEC-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(isValidSecretKeyFormat(key)).toBe(true);
  });

  it('generates unique random keys', () => {
    const key1 = generateSecretKey();
    const key2 = generateSecretKey();
    expect(key1).not.toBe(key2);
  });

  it('normalizes secret keys with various user input formats', () => {
    // Exact match
    expect(normalizeSecretKey('DUO-SEC-A234-B567-C890-D234')).toBe(
      'DUO-SEC-A234-B567-C890-D234'
    );

    // Lowercase
    expect(normalizeSecretKey('duo-sec-a234-b567-c890-d234')).toBe(
      'DUO-SEC-A234-B567-C890-D234'
    );

    // Raw 16 characters without prefix or dashes
    expect(normalizeSecretKey('a234b567c890d234')).toBe(
      'DUO-SEC-A234-B567-C890-D234'
    );

    // With spaces
    expect(normalizeSecretKey('  DUO-SEC-A234-B567-C890-D234  ')).toBe(
      'DUO-SEC-A234-B567-C890-D234'
    );

    // Short or empty keys
    expect(normalizeSecretKey('')).toBe('');
    expect(normalizeSecretKey('SHORT')).toBe('SHORT');
  });

  it('validates correct secret key format', () => {
    expect(isValidSecretKeyFormat('DUO-SEC-ABCD-EFGH-JKLM-NPQR')).toBe(true);
    expect(isValidSecretKeyFormat('INVALID-KEY')).toBe(false);
    expect(isValidSecretKeyFormat('')).toBe(false);
  });
});
