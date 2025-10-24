/**
 * Patch routes.ts to mount emergency admin route
 */
import { wireInto } from './wire-admin-adapter';
export function registerEmergency(app:any){ wireInto(app); }
