import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDuration,
  generateSecureToken,
  hashToken,
  formatLastSeen,
} from '@/lib/utils';

describe('Utility Functions', () => {
  it('should format bytes cleanly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(5242880)).toBe('5 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('should format audio durations into mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(42)).toBe('0:42');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(180)).toBe('3:00');
    expect(formatDuration(3675)).toBe('61:15');
  });

  it('should generate secure tokens with expected length', () => {
    const token = generateSecureToken(16);
    expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('should produce consistent SHA-256 hashes', async () => {
    const testString = 'duochat_secure_invitation_token';
    const hash1 = await hashToken(testString);
    const hash2 = await hashToken(testString);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
  });

  describe('formatLastSeen', () => {
    it('returns "Offline" for null, undefined, or invalid dates', () => {
      expect(formatLastSeen(null)).toBe('Offline');
      expect(formatLastSeen(undefined)).toBe('Offline');
      expect(formatLastSeen('')).toBe('Offline');
      expect(formatLastSeen('not-a-valid-date')).toBe('Offline');
    });

    it('returns "Active just now" for activities within 59 seconds', () => {
      const now = new Date();
      expect(formatLastSeen(now.toISOString())).toBe('Active just now');

      const thirtySecsAgo = new Date(Date.now() - 30 * 1000);
      expect(formatLastSeen(thirtySecsAgo.toISOString())).toBe('Active just now');
    });

    it('returns "Active Xm ago" for activities within 1 to 59 minutes', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatLastSeen(fiveMinsAgo.toISOString())).toBe('Active 5m ago');

      const fiftyNineMinsAgo = new Date(Date.now() - 59 * 60 * 1000);
      expect(formatLastSeen(fiftyNineMinsAgo.toISOString())).toBe('Active 59m ago');
    });

    it('returns "Active Xh ago" or yesterday format for activities within 24 hours', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const res = formatLastSeen(twoHoursAgo.toISOString());
      expect(res.startsWith('Active 2h ago') || res.startsWith('Active yesterday')).toBe(true);
    });

    it('returns "Active Xd ago" for activities between 2 and 6 days', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatLastSeen(threeDaysAgo.toISOString())).toBe('Active 3d ago');
    });

    it('returns formatted date for activities older than 7 days', () => {
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      expect(formatLastSeen(twentyDaysAgo.toISOString())).toMatch(/^Active on [A-Za-z]+ \d+$/);
    });
  });
});
