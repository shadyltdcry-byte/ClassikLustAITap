// Mount emergency admin upgrade fix route
import type { Express } from 'express';
import adminUpgradeFix from './routes/admin.upgrade-fix';

export function registerEmergencyAdmin(app: Express) {
  app.use('/api', adminUpgradeFix);
}
