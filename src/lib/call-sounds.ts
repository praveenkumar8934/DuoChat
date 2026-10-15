'use client';

/**
 * Romantic DuoChat Audio Synthesizer for Call Ringtones & Chimes
 * Uses browser Web Audio API for zero-latency, asset-free reliable playback.
 */

class CallSoundPlayer {
  private ctx: AudioContext | null = null;
  private ringInterval: NodeJS.Timeout | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Play a gentle melodic chord (e.g. for incoming ringing chime)
   */
  private playChord(frequencies: number[], duration = 0.6, type: OscillatorType = 'sine') {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    gainNode.connect(ctx.destination);

    frequencies.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Start ringing loop for incoming call (gentle romantic harmonic chime)
   */
  startIncomingRing() {
    this.stopRing();
    const playTune = () => {
      // E5 -> G#5 -> B5 romantic harmonic arpeggio
      this.playChord([659.25, 830.61], 0.35);
      setTimeout(() => {
        this.playChord([830.61, 987.77], 0.5);
      }, 250);
    };

    playTune();
    this.ringInterval = setInterval(playTune, 2400);
  }

  /**
   * Start outgoing ringing loop (soft pulsing tone)
   */
  startOutgoingRing() {
    this.stopRing();
    const playTune = () => {
      this.playChord([440, 480], 0.8);
    };

    playTune();
    this.ringInterval = setInterval(playTune, 2800);
  }

  /**
   * Stop any active ringing
   */
  stopRing() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  /**
   * Play call connected chime
   */
  playConnected() {
    this.stopRing();
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.playChord([523.25, 659.25, 783.99], 0.45); // C Major chord
  }

  /**
   * Play call ended chime
   */
  playEnded() {
    this.stopRing();
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.playChord([440, 392, 349.23], 0.4); // Descending gentle tone
  }
}

export const callSounds = new CallSoundPlayer();
