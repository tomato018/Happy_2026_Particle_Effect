
export enum AppState {
  BYE_2025 = 'BYE_2025',
  COUNTDOWN = 'COUNTDOWN',
  HAPPY_2026 = 'HAPPY_2026'
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number; // target x
  ty: number; // target y
  size: number;
  color: string;
  active: boolean;
  alpha: number;
  originX: number;
  originY: number;
}

export interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Config {
  particleDensity: number;
  particleSize: number;
  bgAlpha: number;
  palette: 'sunset' | 'gold' | 'rosegold';
  showCamera: boolean;
}

export const PALETTES = {
  cool: ['#00BFFF', '#1ea1ff', '#87CEFA'],
  sunset: ['#f59d2a', '#ffb700', '#ff4800'],
  gold: ['#FFD700', '#DAA520', '#FFFACD'],
  rosegold: ['#fccfee', '#E0B0FF', '#FFB6C1'],
  countdown: '#ccf279'
};
