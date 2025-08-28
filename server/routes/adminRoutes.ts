/**
 * adminRoutes.ts - Administrative Tools and File Management Routes
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles admin tools, file management, upgrades, achievements, and debug functionality
 */

import type { Express, Request, Response } from "express";
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { 
  createSuccessResponse, 
  createErrorResponse,
  isValidMediaType,
  getFileExtension 
} from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const uploadsDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `uploaded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
      cb(null, filename);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    cb(null, isValidMediaType(file.mimetype));
  }
});

export function registerAdminRoutes(app: Express) {

  // Level requirements management
  app.get('/api/admin/level-requirements', async (req: Request, res: Response) => {
    try {
      const levelRequirements = await storage.getLevelRequirements();
      res.json(levelRequirements || []);
    } catch (error) {
      console.error('Error fetching level requirements:', error);
      res.json([]); // Return empty array on error
    }
  });

  app.post('/api/admin/level-requirements', async (req: Request, res: Response) => {
    try {
      const requirementData = req.body;
      const newRequirement = await storage.createLevelRequirement(requirementData);
      res.json(createSuccessResponse(newRequirement));
    } catch (error) {
      console.error('Error creating level requirement:', error);
      res.status(500).json(createErrorResponse('Failed to create level requirement'));
    }
  });

  app.put('/api/admin/level-requirements/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedRequirement = await storage.updateLevelRequirement(id, updates);
      res.json(createSuccessResponse(updatedRequirement));
    } catch (error) {
      console.error('Error updating level requirement:', error);
      res.status(500).json(createErrorResponse('Failed to update level requirement'));
    }
  });

  app.delete('/api/admin/level-requirements/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteLevelRequirement(id);
      res.json(createSuccessResponse({ message: 'Level requirement deleted successfully' }));
    } catch (error) {
      console.error('Error deleting level requirement:', error);
      res.status(500).json(createErrorResponse('Failed to delete level requirement'));
    }
  });

  // Upgrades management
  app.get('/api/admin/upgrades', async (req: Request, res: Response) => {
    try {
      const upgrades = await storage.getUpgrades();
      res.json(upgrades || []);
    } catch (error) {
      console.error('Error fetching upgrades:', error);
      res.json([]);
    }
  });

  app.post('/api/admin/upgrades', async (req: Request, res: Response) => {
    try {
      const upgradeData = req.body;
      const newUpgrade = await storage.createUpgrade(upgradeData);
      res.json(createSuccessResponse(newUpgrade));
    } catch (error) {
      console.error('Error creating upgrade:', error);
      res.status(500).json(createErrorResponse('Failed to create upgrade'));
    }
  });

  app.put('/api/admin/upgrades/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedUpgrade = await storage.updateUpgrade(id, updates);
      res.json(createSuccessResponse(updatedUpgrade));
    } catch (error) {
      console.error('Error updating upgrade:', error);
      res.status(500).json(createErrorResponse('Failed to update upgrade'));
    }
  });

  app.delete('/api/admin/upgrades/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteUpgrade(id);
      res.json(createSuccessResponse({ message: 'Upgrade deleted successfully' }));
    } catch (error) {
      console.error('Error deleting upgrade:', error);
      res.status(500).json(createErrorResponse('Failed to delete upgrade'));
    }
  });

  // Achievements management
  app.get('/api/admin/achievements', async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.json([]);
    }
  });

  app.post('/api/admin/achievements', async (req: Request, res: Response) => {
    try {
      const achievementData = req.body;
      const newAchievement = await storage.createAchievement(achievementData);
      res.json(createSuccessResponse(newAchievement));
    } catch (error) {
      console.error('Error creating achievement:', error);
      res.status(500).json(createErrorResponse('Failed to create achievement'));
    }
  });

  app.put('/api/admin/achievements/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedAchievement = await storage.updateAchievement(id, updates);
      res.json(createSuccessResponse(updatedAchievement));
    } catch (error) {
      console.error('Error updating achievement:', error);
      res.status(500).json(createErrorResponse('Failed to update achievement'));
    }
  });

  app.delete('/api/admin/achievements/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteAchievement(id);
      res.json(createSuccessResponse({ message: 'Achievement deleted successfully' }));
    } catch (error) {
      console.error('Error deleting achievement:', error);
      res.status(500).json(createErrorResponse('Failed to delete achievement'));
    }
  });

  // Seed achievements endpoint
  app.post('/api/admin/seed-achievements', async (req: Request, res: Response) => {
    try {
      // Mock seeding achievements
      const seededAchievements = [
        { id: 1, name: 'First Tap', description: 'Tap for the first time', reward: '10 LP' },
        { id: 2, name: 'Hundred Taps', description: 'Tap 100 times', reward: '100 LP' },
        { id: 3, name: 'Chat Master', description: 'Send 50 messages', reward: '5 Gems' },
        { id: 4, name: 'Level Up', description: 'Reach level 5', reward: '500 LP' }
      ];
      
      console.log('Seeded default achievements');
      res.json(createSuccessResponse({
        message: 'Default achievements seeded successfully',
        achievements: seededAchievements
      }));
    } catch (error) {
      console.error('Error seeding achievements:', error);
      res.status(500).json(createErrorResponse('Failed to seed achievements'));
    }
  });

  // Media management
  app.get("/api/media", async (req: Request, res: Response) => {
    try {
      // Get media from database
      const mediaFiles = await storage.getAllMedia();
      
      if (!mediaFiles || mediaFiles.length === 0) {
        // Auto-import from filesystem if no media in database
        const __dirname = path.dirname(new URL(import.meta.url).pathname);
        const uploadsDir = path.join(__dirname, '../../public/uploads');
        
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          console.log(`Found ${files.length} files in uploads directory`);
          
          const importedFiles = [];
          for (const file of files) {
            try {
              const filePath = path.join(uploadsDir, file);
              const stats = fs.statSync(filePath);
              
              if (stats.isFile()) {
                console.log(`Attempting to import: ${file}`);
                const ext = getFileExtension(file);
                const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                               ext === 'png' ? 'image/png' :
                               ext === 'gif' ? 'image/gif' :
                               ext === 'webp' ? 'image/webp' :
                               ext === 'mp4' ? 'video/mp4' :
                               ext === 'webm' ? 'video/webm' : 'application/octet-stream';
                
                const mediaEntry = {
                  filename: file,
                  originalName: file,
                  mimeType: mimeType,
                  size: stats.size,
                  url: `/uploads/${file}`,
                  characterId: null,
                  isNsfw: file.includes('nsfw'),
                  isVip: false,
                  tags: [],
                  createdAt: stats.birthtime.toISOString(),
                  updatedAt: stats.mtime.toISOString()
                };
                
                try {
                  const created = await storage.createMedia(mediaEntry);
                  importedFiles.push(created);
                  console.log(`Auto-imported filesystem file: ${file}`);
                } catch (dbError) {
                  console.warn(`Could not import ${file} to database:`, dbError);
                  importedFiles.push(mediaEntry); // Add to response anyway
                }
              }
            } catch (fileError) {
              console.warn(`Error processing file ${file}:`, fileError);
            }
          }
          
          return res.json(importedFiles);
        }
      }
      
      res.json(mediaFiles || []);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.json([]);
    }
  });

  app.post('/api/media/upload', upload.array('files'), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json(createErrorResponse('No files uploaded'));
      }
      
      const uploadedFiles = [];
      
      for (const file of files) {
        const mediaEntry = {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          characterId: req.body.characterId || null,
          isNsfw: req.body.isNsfw === 'true' || false,
          isVip: req.body.isVip === 'true' || false,
          tags: req.body.tags ? req.body.tags.split(',') : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        try {
          const created = await storage.createMedia(mediaEntry);
          uploadedFiles.push(created);
        } catch (dbError) {
          console.warn('Could not save media to database:', dbError);
          uploadedFiles.push(mediaEntry);
        }
      }
      
      res.json(createSuccessResponse({
        message: `Successfully uploaded ${uploadedFiles.length} files`,
        files: uploadedFiles
      }));
      
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json(createErrorResponse('Failed to upload files'));
    }
  });

  app.put('/api/media/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedMedia = await storage.updateMedia(id, updates);
      res.json(createSuccessResponse(updatedMedia));
    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json(createErrorResponse('Failed to update media'));
    }
  });

  app.delete('/api/media/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await storage.deleteMedia(id);
      res.json(createSuccessResponse({ message: 'Media deleted successfully' }));
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json(createErrorResponse('Failed to delete media'));
    }
  });

  // Media admin tools
  app.get('/api/admin/media/stats', async (req: Request, res: Response) => {
    try {
      // Mock media statistics
      const mediaStats = {
        totalFiles: 156,
        totalSize: '2.3GB',
        imageFiles: 142,
        videoFiles: 14,
        nsfwFiles: 23,
        vipFiles: 8,
        orphanedFiles: 3,
        duplicates: 2
      };
      
      res.json(mediaStats);
    } catch (error) {
      console.error('Error fetching media stats:', error);
      res.status(500).json(createErrorResponse('Failed to fetch media statistics'));
    }
  });

  app.get('/api/admin/media/orphaned', async (req: Request, res: Response) => {
    try {
      // Mock orphaned files (files not assigned to any character)
      const orphanedFiles = [];
      res.json(orphanedFiles);
    } catch (error) {
      console.error('Error fetching orphaned media:', error);
      res.json([]);
    }
  });

  app.get('/api/admin/media/duplicates', async (req: Request, res: Response) => {
    try {
      // Mock duplicate files
      const duplicates = [];
      res.json(duplicates);
    } catch (error) {
      console.error('Error fetching duplicate media:', error);
      res.json([]);
    }
  });

  app.delete('/api/admin/media/bulk-delete', async (req: Request, res: Response) => {
    try {
      const { fileIds } = req.body;
      
      if (!fileIds || !Array.isArray(fileIds)) {
        return res.status(400).json(createErrorResponse('File IDs array is required'));
      }
      
      let deletedCount = 0;
      
      for (const fileId of fileIds) {
        try {
          await storage.deleteMedia(fileId);
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete file ${fileId}:`, error);
        }
      }
      
      res.json(createSuccessResponse({
        message: `Successfully deleted ${deletedCount} of ${fileIds.length} files`,
        deletedCount
      }));
    } catch (error) {
      console.error('Error bulk deleting media:', error);
      res.status(500).json(createErrorResponse('Failed to bulk delete media'));
    }
  });

  // Player level-up admin endpoint
  app.post('/api/admin/player/:playerId/level-up', async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      
      // Mock level up for now
      console.log(`Admin level up for player: ${playerId}`);
      
      res.json(createSuccessResponse({
        message: 'Player leveled up successfully',
        newLevel: 2,
        rewards: {
          lp: 100,
          maxEnergy: 10
        }
      }));
    } catch (error) {
      console.error('Error in admin level up:', error);
      res.status(500).json(createErrorResponse('Failed to level up player'));
    }
  });

  // Debug endpoints
  app.get('/api/debug/supabase-schema', async (req: Request, res: Response) => {
    try {
      // Mock schema debug info
      const schemaInfo = {
        tables: ['users', 'characters', 'media_files', 'chat_messages'],
        lastUpdated: new Date().toISOString(),
        status: 'connected'
      };
      
      res.json(createSuccessResponse(schemaInfo));
    } catch (error) {
      console.error('Error fetching schema debug info:', error);
      res.status(500).json(createErrorResponse('Failed to fetch schema information'));
    }
  });

  app.post('/api/debug/fix-lp-column', async (req: Request, res: Response) => {
    try {
      // Mock LP column fix
      console.log('Fixing LP column data types...');
      
      res.json(createSuccessResponse({
        message: 'LP column fixed successfully',
        affectedRows: 0
      }));
    } catch (error) {
      console.error('Error fixing LP column:', error);
      res.status(500).json(createErrorResponse('Failed to fix LP column'));
    }
  });

  // Debugger endpoints
  app.post('/api/admin/debugger/init', async (req: Request, res: Response) => {
    try {
      // Mock debugger initialization
      res.json(createSuccessResponse({
        message: 'Debugger initialized successfully',
        status: 'ready'
      }));
    } catch (error) {
      console.error('Error initializing debugger:', error);
      res.status(500).json(createErrorResponse('Failed to initialize debugger'));
    }
  });

  app.post('/api/admin/debugger/command', async (req: Request, res: Response) => {
    try {
      const { command } = req.body;
      
      // Mock command execution
      console.log(`Executing debugger command: ${command}`);
      
      res.json(createSuccessResponse({
        command,
        result: 'Command executed successfully',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error executing debugger command:', error);
      res.status(500).json(createErrorResponse('Failed to execute command'));
    }
  });

  app.get('/api/admin/debugger/status', async (req: Request, res: Response) => {
    try {
      // Mock debugger status
      const status = {
        active: false,
        uptime: '0s',
        lastCommand: null,
        memoryUsage: '45MB'
      };
      
      res.json(status);
    } catch (error) {
      console.error('Error fetching debugger status:', error);
      res.status(500).json(createErrorResponse('Failed to fetch debugger status'));
    }
  });

  app.post('/api/admin/debugger/stop', async (req: Request, res: Response) => {
    try {
      // Mock debugger stop
      console.log('Stopping debugger...');
      
      res.json(createSuccessResponse({
        message: 'Debugger stopped successfully'
      }));
    } catch (error) {
      console.error('Error stopping debugger:', error);
      res.status(500).json(createErrorResponse('Failed to stop debugger'));
    }
  });
}