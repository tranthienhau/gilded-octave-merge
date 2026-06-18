// The gem tier ladder. Ten jewels, each tied to a note of the scale (Do..Mi C5),
// climbing to a single durable end-goal: the Mega Diamond.

export interface GemDef {
  name: string;
  note: string; // solfege
  sci: string; // scientific pitch
  base: string;
  light: string;
  dark: string;
  r: number; // visual radius at design scale (430px-wide well)
  freq: number; // per-merge note sample frequency (Hz)
}

export const GEMS: GemDef[] = [
  { name: 'Garnet', note: 'Do', sci: 'C4', base: '#a01f3c', light: '#e0667e', dark: '#5e0f22', r: 16, freq: 261.63 },
  { name: 'Citrine', note: 'Re', sci: 'D4', base: '#e0852b', light: '#f6bd6f', dark: '#7d4310', r: 21, freq: 293.66 },
  { name: 'Topaz', note: 'Mi', sci: 'E4', base: '#f1c64a', light: '#fde79a', dark: '#9a7714', r: 27, freq: 329.63 },
  { name: 'Peridot', note: 'Fa', sci: 'F4', base: '#9fc54d', light: '#d4ec92', dark: '#566f1f', r: 34, freq: 349.23 },
  { name: 'Emerald', note: 'Sol', sci: 'G4', base: '#2fa06a', light: '#79d6a7', dark: '#13502f', r: 42, freq: 392.0 },
  { name: 'Aquamarine', note: 'La', sci: 'A4', base: '#29a3c0', light: '#7fd9ec', dark: '#0f5364', r: 51, freq: 440.0 },
  { name: 'Sapphire', note: 'Ti', sci: 'B4', base: '#2f5fd0', light: '#7d9cf0', dark: '#142e72', r: 61, freq: 493.88 },
  { name: 'Amethyst', note: 'Do', sci: 'C5', base: '#8a4fc8', light: '#c39bee', dark: '#43225f', r: 72, freq: 523.25 },
  { name: 'Morganite', note: 'Re', sci: 'D5', base: '#e06aa0', light: '#f6abcb', dark: '#7a2f53', r: 84, freq: 587.33 },
  { name: 'Diamond', note: 'Mi', sci: 'E5', base: '#dfeaf5', light: '#ffffff', dark: '#8fa6bd', r: 97, freq: 659.25 },
];

// Two Diamonds (top tier, index 9) fuse into the Mega Diamond (tier index 11).
export const MEGA = { name: 'Mega Diamond', base: '#cfe0f2', r: 120 };
export const MEGA_TIER = 11;
export const TOP_TIER = GEMS.length - 1; // 9 == Diamond

// Points awarded for producing a gem of the resulting tier (index = resulting tier).
export const MERGE_PTS = [0, 0, 15, 30, 55, 90, 140, 210, 300, 420, 560];
export const MEGA_BONUS = 1500;

// Only the lower tiers ever drop from the top; higher tiers are earned by merging.
export const SPAWN_POOL = [0, 0, 0, 1, 1, 2, 3];
