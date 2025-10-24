/**
 * Wire emergency admin route into main registerRoutes
 */
import type { Express } from 'express';
import { wireEmergency } from './wire-emergency';

export function wireInto(app: Express) {
  wireEmergency(app);
}
