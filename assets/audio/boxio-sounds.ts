/* Boxio canonical no-external-file audio asset bank.
   Original synthesized audio; no external recordings or licenses. Works in modern browser Web Audio.
   Use AudioContext after a user gesture. Honor mute and avoid playback while reduced effects are requested.
   Event IDs are stable and referenced by GitHub issues. */
export type BoxioSound = "edge" | "invalid" | "capture" | "multi" | "extra_turn" | "next_turn" | "join" | "reconnect" | "disconnect" | "victory" | "tie" | "click";
export const soundCatalog: Record<BoxioSound, { notes: number[]; duration: number; type: OscillatorType; gain: number }> = {
 edge:{notes:[520],duration:.065,type:"sine",gain:.11},
 invalid:{notes:[220,180],duration:.12,type:"triangle",gain:.075},
 capture:{notes:[587,784],duration:.18,type:"sine",gain:.15},
 multi:{notes:[523,659,784,1047],duration:.38,type:"sine",gain:.16},
 extra_turn:{notes:[740,987],duration:.16,type:"triangle",gain:.085},
 next_turn:{notes:[330,440],duration:.13,type:"sine",gain:.07},
 join:{notes:[523,698],duration:.17,type:"sine",gain:.11},
 reconnect:{notes:[440,660,880],duration:.25,type:"sine",gain:.11},
 disconnect:{notes:[494,330],duration:.22,type:"triangle",gain:.07},
 victory:{notes:[523,659,784,1047,1319],duration:.70,type:"triangle",gain:.13},
 tie:{notes:[440,554,659],duration:.38,type:"sine",gain:.10},
 click:{notes:[660],duration:.05,type:"sine",gain:.07},
};
export function playBoxioSound(ctx: AudioContext, sound: BoxioSound, enabled = true): void {
 if (!enabled || ctx.state !== "running") return;
 const s=soundCatalog[sound], now=ctx.currentTime, step=s.duration / s.notes.length;
 s.notes.forEach((frequency,i)=>{
   const o=ctx.createOscillator(), g=ctx.createGain(), t=now+i*step;
   o.type=s.type; o.frequency.setValueAtTime(frequency,t);
   g.gain.setValueAtTime(.0001,t);
   g.gain.exponentialRampToValueAtTime(s.gain, t+.012);
   g.gain.exponentialRampToValueAtTime(.0001,t+step*.94);
   o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+step);
 });
}
