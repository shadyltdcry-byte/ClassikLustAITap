/**
 * utils.ts - Shared helper functions
 * Last Edited: 2025-08-17 by Steven
 */

export function formatPoints(points: number) {
  return points.toLocaleString();
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// TODO: add more shared helpers (timers, AI response parsers, etc.)