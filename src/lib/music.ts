const TRACK_SRC = "/audio/background.mp3";
const TRACK_LEVEL = 0.6;
const FADE_MS = 600;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Music {
  private track: HTMLAudioElement | null = null;
  private fadeTimer: number | null = null;
  playing = false;

  /** Devuelve false si el navegador bloqueó el autoplay (falta un gesto del visitante). */
  async start() {
    if (this.playing) return true;
    this.cancelFade();
    this.track ??= Object.assign(new Audio(TRACK_SRC), { loop: true, preload: "auto" });
    const a = this.track;
    a.volume = 0;
    try {
      // play() va primero y sin await previo: iOS exige que arranque dentro del gesto.
      await a.play();
    } catch {
      return false;
    }
    // Que play() resuelva no garantiza que suene: comprobamos que el tiempo avanza.
    const t0 = a.currentTime;
    const deadline = performance.now() + 2000;
    while (a.currentTime === t0 && performance.now() < deadline) await wait(100);
    if (a.paused || a.currentTime === t0) {
      a.pause();
      return false;
    }
    this.playing = true;
    this.fade(TRACK_LEVEL);
    return true;
  }

  /** Silencia con fundido y pausa la pista. */
  stop() {
    if (!this.playing) return;
    this.playing = false;
    this.fade(0, () => this.track?.pause());
  }

  private cancelFade() {
    if (this.fadeTimer === null) return;
    window.clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }

  /** Fundido por tiempo (setInterval, no rAF: rAF se congela en pestañas en segundo plano). */
  private fade(to: number, done?: () => void) {
    const a = this.track;
    if (!a) return;
    this.cancelFade();
    const from = a.volume;
    const t0 = performance.now();
    this.fadeTimer = window.setInterval(() => {
      const k = Math.max(0, Math.min(1, (performance.now() - t0) / FADE_MS));
      a.volume = from + (to - from) * k;
      if (k >= 1) {
        this.cancelFade();
        done?.();
      }
    }, 30);
  }
}

export const music = new Music();
