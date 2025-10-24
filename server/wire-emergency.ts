/**
 * Register the emergency admin fix during route registration
 */
import type { Express } from 'express';
import { registerEmergencyAdmin } from './routes.register-emergency';

export function wireEmergency(app: Express) {
  registerEmergencyAdmin(app);
}
