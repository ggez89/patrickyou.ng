/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuroraStrandType {
  baseX: number;
  phaseOffset: number;
  speedFactor: number;
  thicknessScale: number;
  alpha: number;
  targetAlpha: number;
  fadeSpeed: number;
  waveFreqY1: number;
  waveFreqY2: number;
}

export interface MousePaintStroke {
  x: number;
  y: number;
  radius: number;
  intensity: number; // 0 to 1
  decayRate: number;
  id: string;
}

export interface CursorTrailParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  speed: number;
  opacity: number;
  scale: number;
}
