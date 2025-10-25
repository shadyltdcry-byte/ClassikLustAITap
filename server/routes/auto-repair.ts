import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

export function createAutoRepairRouter() {
  const router = Router();

  // Auto-repair endpoint that can patch files server-side
  router.post('/auto-repair/apply-fixes', async (req: Request, res: Response) => {
    try {
      const { fixes } = req.body;
      
      if (!fixes || !Array.isArray(fixes)) {
        return res.status(400).json({ error: 'Invalid fixes payload' });
      }

      const results = [];
      
      for (const fix of fixes) {
        try {
          await applyImportFix(fix);
          results.push({ component: fix.name, status: 'fixed' });
        } catch (error) {
          results.push({ component: fix.name, status: 'failed', error: String(error) });
        }
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error('Auto-repair error:', error);
      res.status(500).json({ error: 'Auto-repair failed', details: String(error) });
    }
  });

  // Get current import status
  router.get('/auto-repair/status', async (req: Request, res: Response) => {
    try {
      const gameGUIPath = path.join(process.cwd(), 'client/src/components/GameGUI.tsx');
      const content = await fs.readFile(gameGUIPath, 'utf8');
      
      // Extract current imports
      const imports = extractImports(content);
      
      res.json({ success: true, currentImports: imports });
    } catch (error) {
      res.status(500).json({ error: 'Failed to read GameGUI', details: String(error) });
    }
  });

  return router;
}

// Apply import fix to GameGUI.tsx
async function applyImportFix(fix: { name: string; currentImport: string; correctImport: string }) {
  const gameGUIPath = path.join(process.cwd(), 'client/src/components/GameGUI.tsx');
  let content = await fs.readFile(gameGUIPath, 'utf8');
  
  // Replace the incorrect import with the correct one
  const oldImportRegex = new RegExp(
    fix.currentImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
    'g'
  );
  
  if (content.match(oldImportRegex)) {
    content = content.replace(oldImportRegex, fix.correctImport);
    
    // Backup original first
    await fs.writeFile(`${gameGUIPath}.backup.${Date.now()}`, await fs.readFile(gameGUIPath, 'utf8'));
    
    // Write fixed version
    await fs.writeFile(gameGUIPath, content);
    
    console.log(`🔧 AUTO-REPAIR: Fixed import for ${fix.name}`);
  } else {
    throw new Error(`Import pattern not found: ${fix.currentImport}`);
  }
}

// Extract imports from GameGUI content
function extractImports(content: string) {
  const importRegex = /import\s+(?:{[^}]*}|\w+)\s+from\s+["']([^"']+)["'];?/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push({
      statement: match[0],
      path: match[1]
    });
  }
  
  return imports;
}
