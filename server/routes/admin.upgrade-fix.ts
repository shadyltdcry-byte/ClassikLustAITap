/**
 * Admin wire-up: call emergency schema fix from admin /fix-schema
 */
import { Router } from 'express';
import { fixUpgradeSchemaNow } from '../../shared/utils/fixUpgradeSchema';

const router = Router();

router.post('/admin/fix-upgrade-schema-now', async (req, res) => {
  try {
    await fixUpgradeSchemaNow();
    res.json({ success: true, message: 'Upgrade schema verified/created' });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
