import { describe, it, expect } from 'vitest';
import {
  generateSecretKey,
  normalizeSecretKey,
  isValidSecretKeyFormat,
} from '@/lib/secret-key';

describe('Secret Key Utilities', () => {
  it('generates a suggested 16-character grouped secret key starting with DUO-SEC-', () => {
    const key = generateSecretKey();
    expect(key).toMatch(/^DUO-SEC-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(isValidSecretKeyFormat(key)).toBe(true);
  });

  it('generates unique random suggested keys', () => {
    const key1 = generateSecretKey();
    const key2 = generateSecretKey();
    expect(key1).not.toBe(key2);
  });

  it('normalizes secret keys and trims user inputs', () => {
    // Custom user keys are preserved and trimmed
    expect(normalizeSecretKey('  my_custom_secret_key_123  ')).toBe(
      'my_custom_secret_key_123'
    );

    // 16-character alphanumeric pattern gets formatted
    expect(normalizeSecretKey('duo-sec-a234-b567-c890-d234')).toBe(
      'DUO-SEC-A234-B567-C890-D234'
    );

    expect(normalizeSecretKey('a234b567c890d234')).toBe(
      'DUO-SEC-A234-B567-C890-D234'
    );

    // Empty key returns empty string
    expect(normalizeSecretKey('')).toBe('');
    expect(normalizeSecretKey(null)).toBe('');
  });

  it('validates custom user secret key length requirements (4-64 characters)', () => {
    expect(isValidSecretKeyFormat('pass')).toBe(true);
    expect(isValidSecretKeyFormat('my_super_secret_code_12345')).toBe(true);
    expect(isValidSecretKeyFormat('DUO-SEC-ABCD-EFGH-JKLM-NPQR')).toBe(true);

    // Too short
    expect(isValidSecretKeyFormat('abc')).toBe(false);
    expect(isValidSecretKeyFormat('')).toBe(false);
    expect(isValidSecretKeyFormat(null)).toBe(false);

    // Too long (>64)
    expect(isValidSecretKeyFormat('a'.repeat(65))).toBe(false);
  });
});
