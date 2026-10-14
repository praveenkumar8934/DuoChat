import { describe, it, expect } from 'vitest';
import { getMessageBubbleThemeClasses, getMessageThemeConfig } from '@/components/chat/message-bubble';

describe('getMessageThemeConfig & getMessageBubbleThemeClasses', () => {
  it('returns high contrast outgoing and incoming bubble styles for aurora-live', () => {
    const configOut = getMessageThemeConfig('aurora-live', true);
    const configIn = getMessageThemeConfig('aurora-live', false);

    expect(configOut.bubbleClass).toContain('bg-gradient-to-r');
    expect(configOut.bubbleClass).toContain('text-white');
    expect(configIn.bubbleClass).toContain('bg-[#1e293b]');
    expect(configIn.bubbleClass).toContain('border-teal-400');
  });

  it('returns high contrast outgoing and incoming bubble styles for sakura-live', () => {
    const configOut = getMessageThemeConfig('sakura-live', true);
    const configIn = getMessageThemeConfig('sakura-live', false);

    expect(configOut.bubbleClass).toContain('from-rose-600');
    expect(configIn.bubbleClass).toContain('bg-white');
    expect(configIn.bubbleClass).toContain('border-rose-300');
  });

  it('returns high contrast outgoing and incoming bubble styles for cyber-live', () => {
    const configOut = getMessageThemeConfig('cyber-live', true);
    const configIn = getMessageThemeConfig('cyber-live', false);

    expect(configOut.bubbleClass).toContain('border-pink-400');
    expect(configIn.bubbleClass).toContain('border-cyan-400');
    expect(configIn.bubbleClass).toContain('bg-[#111827]');
  });

  it('returns high contrast outgoing and incoming bubble styles for doodle', () => {
    const configOut = getMessageThemeConfig('doodle', true);
    const configIn = getMessageThemeConfig('doodle', false);

    expect(configOut.bubbleClass).toContain('bg-[#d9fdd3]');
    expect(configIn.bubbleClass).toContain('bg-white');
  });

  it('getMessageBubbleThemeClasses matches getMessageThemeConfig bubbleClass', () => {
    const bubbleClass = getMessageBubbleThemeClasses('cosmic-live', true);
    const config = getMessageThemeConfig('cosmic-live', true);

    expect(bubbleClass).toBe(config.bubbleClass);
    expect(bubbleClass).toContain('from-purple-600');
  });

  it('falls back to romantic default for unknown theme without blending into background', () => {
    const configOut = getMessageThemeConfig('unknown-theme', true);
    const configIn = getMessageThemeConfig('unknown-theme', false);

    expect(configOut.bubbleClass).toContain('from-[#9f1239]');
    expect(configIn.bubbleClass).toContain('bg-white');
  });
});
