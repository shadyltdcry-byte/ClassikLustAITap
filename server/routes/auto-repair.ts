import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

export function createAutoRepairRouter() {
  const router = Router();

  // Auto-repair endpoint that patches GameGUI.tsx with correct imports
  router.post('/auto-repair/apply-fixes', async (req: Request, res: Response) => {
    try {
      const { fixes } = req.body;
      console.log('🔧 [AUTO-REPAIR] Received fixes:', fixes?.length || 0);
      
      if (!fixes || !Array.isArray(fixes)) {
        return res.status(400).json({ error: 'Invalid fixes payload' });
      }

      const results = [];
      const gameGUIPath = path.join(process.cwd(), 'client/src/components/GameGUI.tsx');
      
      // Create backup
      const backupPath = `${gameGUIPath}.backup.${Date.now()}`;
      await fs.copyFile(gameGUIPath, backupPath);
      console.log('💾 [AUTO-REPAIR] Backup created:', backupPath);
      
      // Read current content
      let content = await fs.readFile(gameGUIPath, 'utf8');
      
      // Apply each fix
      for (const fix of fixes) {
        try {
          const oldImportPattern = fix.currentImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(oldImportPattern, 'g');
          
          if (content.match(regex)) {
            content = content.replace(regex, fix.correctImport);
            results.push({ component: fix.name, status: 'fixed' });
            console.log(`✅ [AUTO-REPAIR] Fixed import for ${fix.name}`);
          } else {
            results.push({ component: fix.name, status: 'not_found', error: 'Import pattern not found in GameGUI' });
            console.log(`⚠️ [AUTO-REPAIR] Pattern not found for ${fix.name}`);
          }
        } catch (error) {
          results.push({ component: fix.name, status: 'failed', error: String(error) });
          console.log(`❌ [AUTO-REPAIR] Failed to fix ${fix.name}: ${error}`);
        }
      }
      
      // Write patched file
      await fs.writeFile(gameGUIPath, content);
      console.log('🚀 [AUTO-REPAIR] GameGUI.tsx patched successfully');
      
      res.json({ 
        success: true, 
        results,
        backup: backupPath,
        message: `Applied ${results.filter(r => r.status === 'fixed').length} fixes`
      });
      
    } catch (error) {
      console.error('🚨 [AUTO-REPAIR] Critical error:', error);
      res.status(500).json({ error: 'Auto-repair failed', details: String(error) });
    }
  });

  // Health check
  router.get('/auto-repair/status', async (req: Request, res: Response) => {
    res.json({ 
      status: 'ready', 
      timestamp: new Date().toISOString(),
      message: 'Auto-repair system online' 
    });
  });

  return router;
}
