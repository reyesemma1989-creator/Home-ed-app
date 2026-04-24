// Generative audio fallback using Tone.js. Synthesized live, no files, no ads.

import * as Tone from 'tone';

export type Mood = 'morning' | 'hype' | 'calm';

type Session = {
  stop: () => void;
  mood: Mood;
};

let active: Session | null = null;

const morningScale = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'E6', 'G6'];
const hypeBassNotes = ['C2', 'C2', 'G2', 'Eb2', 'F2', 'C2', 'Bb1', 'G2'];
const hypeLeadNotes = ['C4', 'Eb4', 'G4', 'Bb4', 'C5', 'Bb4', 'G4', 'F4'];
const calmScale = ['C4', 'E4', 'G4', 'A4', 'D5', 'E5', 'G5'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function startGenerative(mood: Mood): Promise<Session> {
  if (active) active.stop();
  await Tone.start();
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
  Tone.getTransport().bpm.value = mood === 'hype' ? 104 : mood === 'morning' ? 76 : 60;

  const disposables: Array<{ dispose: () => void }> = [];

  if (mood === 'morning') {
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.35 }).toDestination();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 1.2 },
    }).connect(reverb);
    disposables.push(synth, reverb);

    const loop = new Tone.Loop((time) => {
      const n = pick(morningScale);
      synth.triggerAttackRelease(n, '8n', time, 0.22);
      if (Math.random() < 0.35) {
        synth.triggerAttackRelease(pick(morningScale), '8n', time + 0.22, 0.14);
      }
    }, '2n');
    loop.start(0);
    disposables.push(loop);
  } else if (mood === 'hype') {
    const bassFilter = new Tone.Filter({ frequency: 900, type: 'lowpass' }).toDestination();
    const bass = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.2 },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3, baseFrequency: 200, octaves: 2 },
    }).connect(bassFilter);
    const lead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.15, release: 0.25 },
    }).toDestination();
    lead.volume.value = -10;
    const kick = new Tone.MembraneSynth({ pitchDecay: 0.04, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 } }).toDestination();
    const hat = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.05, release: 0.02 }, harmonicity: 5.1, resonance: 800 }).toDestination();
    hat.volume.value = -24;
    disposables.push(bass, bassFilter, lead, kick, hat);

    let bi = 0;
    let li = 0;
    const kickLoop = new Tone.Loop((time) => kick.triggerAttackRelease('C1', '8n', time, 0.9), '4n').start(0);
    const hatLoop = new Tone.Loop((time) => hat.triggerAttackRelease('32n', time, 0.3), '8n').start(0);
    const bassLoop = new Tone.Loop((time) => {
      const n = hypeBassNotes[bi % hypeBassNotes.length];
      bi++;
      bass.triggerAttackRelease(n, '8n', time, 0.7);
    }, '4n').start(0);
    const leadLoop = new Tone.Loop((time) => {
      if (Math.random() < 0.55) {
        const n = hypeLeadNotes[li % hypeLeadNotes.length];
        li++;
        lead.triggerAttackRelease(n, '16n', time, 0.4);
      }
    }, '8n').start(0);
    disposables.push(kickLoop, hatLoop, bassLoop, leadLoop);
  } else {
    const reverb = new Tone.Reverb({ decay: 6, wet: 0.5 }).toDestination();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.4, decay: 0.6, sustain: 0.3, release: 2 },
    }).connect(reverb);
    disposables.push(synth, reverb);
    const loop = new Tone.Loop((time) => {
      synth.triggerAttackRelease(pick(calmScale), '1n', time, 0.2);
    }, '1m').start(0);
    disposables.push(loop);
  }

  Tone.getTransport().start();

  active = {
    mood,
    stop: () => {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      disposables.forEach((d) => {
        try {
          d.dispose();
        } catch {}
      });
      active = null;
    },
  };
  return active;
}

export function stopGenerative() {
  active?.stop();
  active = null;
}
