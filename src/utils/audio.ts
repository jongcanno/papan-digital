/**
 * Web Audio API Synthesizer for Digital Sports Stadium Buzzer & Alerts
 * Completely client-side, self-contained, no external MP3 dependencies
 */

class AudioBuzzerService {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Main Sports Arena Horn / Buzzer (used at 00:00 full time & manual buzzer)
   */
  public playBuzzer(durationSeconds = 1.6): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      // Fast attack
      gainNode.gain.linearRampToValueAtTime(0.85, now + 0.05);
      // Sustain
      gainNode.gain.setValueAtTime(0.85, now + durationSeconds - 0.2);
      // Smooth decay
      gainNode.gain.linearRampToValueAtTime(0.001, now + durationSeconds);

      // Lowpass filter to shape stadium horn timbre
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      // Two detuned sawtooth & square oscillators for deep athletic horn roar
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.linearRampToValueAtTime(300, now + durationSeconds);

      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(480, now);
      osc2.frequency.linearRampToValueAtTime(450, now + durationSeconds);

      const osc3 = ctx.createOscillator();
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(160, now);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + durationSeconds + 0.05);
      osc2.stop(now + durationSeconds + 0.05);
      osc3.stop(now + durationSeconds + 0.05);
    } catch (e) {
      console.warn('Audio buzzer play error:', e);
    }
  }

  /**
   * Short tactical whistle / high beep for action confirmations
   */
  public playWhistle(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio whistle play error:', e);
    }
  }
}

export const audioBuzzer = new AudioBuzzerService();
