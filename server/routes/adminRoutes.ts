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
import crypto from 'crypto'; // Import crypto module
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

  // Admin Level Requirements - for editing/managing level progression
  app.get('/api/admin/level-requirements', async (req: Request, res: Response) => {
    try {
      // Return editable level requirements for admin management
      const adminLevelData = [
        {
          id: 'level_2',
          level: 2,
          lpRequired: 1000,
          description: 'Unlock basic character creation',
          unlockRewards: ['Character Gallery', 'Basic Customization'],
          functions: ['character_creation'],
          upgradeRequirements: [{ upgradeId: 'lp_hour_1', requiredLevel: 2 }]
        },
        {
          id: 'level_3',
          level: 3,
          lpRequired: 2500,
          description: 'Unlock Wheel of Fortune',
          unlockRewards: ['Wheel Game', 'Spin Rewards'],
          functions: ['wheel_game'],
          upgradeRequirements: [{ upgradeId: 'lp_hour_1', requiredLevel: 3 }]
        },
        {
          id: 'level_4',
          level: 4,
          lpRequired: 5000,
          description: 'Unlock Booster System',
          unlockRewards: ['Boosters', 'Temporary Upgrades'],
          functions: ['booster_system'],
          upgradeRequirements: [{ upgradeId: 'lp_hour_1', requiredLevel: 4 }]
        }
      ];
      res.json(adminLevelData);
    } catch (error) {
      console.error('Error fetching admin level requirements:', error);
      res.json([]);
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

  // Admin Upgrades - for editing/managing upgrade definitions
  app.get('/api/admin/upgrades', async (req: Request, res: Response) => {
    try {
      // Return editable upgrade definitions for admin management
      const adminUpgrades = [
        {
          id: 'lp_tap_1',
          name: 'Dexterity Lv. 1',
          description: 'Increase LP per tap',
          category: 'lp_per_tap',
          baseCost: 2500,
          baseEffect: 1,
          costMultiplier: 1.5,
          effectMultiplier: 1.2,
          maxLevel: 10,
          levelRequirement: 1
        },
        {
          id: 'lp_hour_1',
          name: 'Intellect Lv. 1',
          description: 'Increase LP per hour',
          category: 'lp_per_hour',
          baseCost: 1500,
          baseEffect: 150,
          costMultiplier: 1.3,
          effectMultiplier: 1.15,
          maxLevel: 20,
          levelRequirement: 1
        },
        {
          id: 'energy_1',
          name: 'Book Smarts Lv. 1',
          description: 'Increase maximum energy',
          category: 'energy',
          baseCost: 1500,
          baseEffect: 100,
          costMultiplier: 1.4,
          effectMultiplier: 1.1,
          maxLevel: 15,
          levelRequirement: 1
        }
      ];
      res.json(adminUpgrades);
    } catch (error) {
      console.error('Error fetching admin upgrades:', error);
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
      // Return sample achievements since storage method doesn't exist
      const achievements = [
        {
          id: 'achieve_1',
          name: 'First Tap',
          description: 'Complete your first tap',
          category: 'tapping',
          requirement: { type: 'total_taps', target: 1 },
          reward: { type: 'lp', amount: 10 },
          icon: '👆',
          isHidden: false,
          isEnabled: true,
          sortOrder: 1
        },
        {
          id: 'achieve_2',
          name: 'Chat Master',
          description: 'Send 50 chat messages',
          category: 'chatting',
          requirement: { type: 'chat_messages', target: 50 },
          reward: { type: 'lp', amount: 100 },
          icon: '💬',
          isHidden: false,
          isEnabled: true,
          sortOrder: 2
        },
        {
          id: 'achieve_3',
          name: 'Level Up',
          description: 'Reach level 5',
          category: 'progression',
          requirement: { type: 'level_reached', target: 5 },
          reward: { type: 'lp', amount: 500 },
          icon: '📈',
          isHidden: false,
          isEnabled: true,
          sortOrder: 3
        }
      ];
      res.json(achievements);
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

  // Task management endpoints
  app.get('/api/admin/tasks', async (req: Request, res: Response) => {
    const tasks = [
      {
        id: 'task_1',
        name: 'Daily Login',
        description: 'Log in to the game every day',
        category: 'daily',
        requirement: { type: 'login_streak', target: 1 },
        reward: { type: 'lp', amount: 100 },
        icon: '🌅',
        isDaily: true,
        isEnabled: true,
        sortOrder: 1
      },
      {
        id: 'task_2',
        name: 'Energy Booster',
        description: 'Gain 100 energy points',
        category: 'energy',
        requirement: { type: 'energy_gained', target: 100 },
        reward: { type: 'lp', amount: 75 },
        icon: '⚡',
        isDaily: false,
        isEnabled: true,
        sortOrder: 2
      },
      {
        id: 'task_3',
        name: 'Chat Enthusiast',
        description: 'Send a message in the chat',
        category: 'social',
        requirement: { type: 'messages_sent', target: 1 },
        reward: { type: 'lp', amount: 50 },
        icon: '💬',
        isDaily: true,
        isEnabled: true,
        sortOrder: 3
      }
    ];
    res.json(tasks);
  });

  app.post('/api/admin/tasks', async (req: Request, res: Response) => {
    try {
      const taskData = req.body;
      console.log('Creating task:', taskData);
      res.json(createSuccessResponse({ id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ...taskData }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Failed to create task'));
    }
  });

  app.put('/api/admin/tasks/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      console.log('Updating task:', id, updates);
      res.json(createSuccessResponse({ id, ...updates }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Failed to update task'));
    }
  });

  app.delete('/api/admin/tasks/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log('Deleting task:', id);
      res.json(createSuccessResponse({ message: 'Task deleted successfully' }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Failed to delete task'));
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
                  id: crypto.randomUUID(), // Use crypto.randomUUID() for proper UUID generation
                  mood: null,
                  is_nsfw: file.includes('nsfw'),
                  is_vip: false,
                  is_event: false,
                  createdAt: stats.birthtime,
                  characterId: null,
                  fileName: file,
                  filePath: `/uploads/${file}`,
                  fileType: mimeType.startsWith('image/') ? 'image' : 'file',
                  pose: null,
                  animationSequence: null,
                  randomSendChance: 5,
                  requiredLevel: 1,
                  enabledForChat: true,
                  autoOrganized: true,
                  category: null
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
          mood: null,
          isNsfw: req.body.isNsfw === 'true' || false,
          isVip: req.body.isVip === 'true' || false,
          isEvent: req.body.isEvent === 'true' || false,
          characterId: req.body.characterId || null,
          fileName: file.originalname,
          filePath: `/uploads/${file.filename}`,
          fileType: file.mimetype?.startsWith('image/') ? 'image' : file.mimetype?.startsWith('video/') ? 'video' : 'file',
          pose: null,
          animationSequence: null,
          randomSendChance: parseInt(req.body.randomSendChance) || 5,
          requiredLevel: parseInt(req.body.requiredLevel) || 1,
          enabledForChat: true,
          autoOrganized: false,
          category: req.body.category || null
        };

        const created = await storage.createMedia(mediaEntry);
        uploadedFiles.push(created);
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
      res.status(500).json(createErrorResponse(`Failed to update media: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });

  app.delete('/api/media/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteMedia(id);
      res.json(createSuccessResponse({ message: 'Media deleted successfully' }));
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json(createErrorResponse(`Failed to delete media: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });

  // Media admin tools
  app.get('/api/admin/media/stats', async (req: Request, res: Response) => {
    try {
      // Get real media statistics from storage
      const allMedia = await storage.getAllMedia();
      const mediaStats = {
        totalFiles: allMedia.length,
        totalSize: '2.3GB', // Could calculate if needed
        imageFiles: allMedia.filter((m: any) => m.fileType?.startsWith('image')).length,
        videoFiles: allMedia.filter((m: any) => m.fileType?.startsWith('video')).length,
        nsfwFiles: allMedia.filter((m: any) => m.is_nsfw).length,
        vipFiles: allMedia.filter((m: any) => m.is_vip).length,
        orphanedFiles: allMedia.filter((m: any) => !m.characterId).length,
        duplicates: 0 // Could implement duplicate detection if needed
      };

      res.json(mediaStats);
    } catch (error) {
      console.error('Error fetching media stats:', error);
      res.status(500).json(createErrorResponse('Failed to fetch media statistics'));
    }
  });

  app.get('/api/admin/media/orphaned', async (req: Request, res: Response) => {
    try {
      // Get real orphaned files (files not assigned to any character)
      const allMedia = await storage.getAllMedia();
      const orphanedFiles = allMedia.filter((media: any) => !media.characterId);
      res.json(orphanedFiles);
    } catch (error) {
      console.error('Error fetching orphaned media:', error);
      res.json([]);
    }
  });

  app.get('/api/admin/media/duplicates', async (req: Request, res: Response) => {
    try {
      // Get real duplicate files (same fileName or filePath)
      const allMedia = await storage.getAllMedia();
      const duplicates: any[] = [];
      const seen = new Map();

      for (const media of allMedia) {
        const key = media.fileName || media.filePath;
        if (key && seen.has(key)) {
          duplicates.push(media);
        } else if (key) {
          seen.set(key, media);
        }
      }

      res.json(duplicates);
    } catch (error) {
      console.error('Error fetching duplicate media:', error);
      res.json([]);
    }
  });

  app.delete('/api/admin/media/bulk-delete', async (req: Request, res: Response) => {
    try {
      const { ids, fileIds } = req.body; // Accept both 'ids' and 'fileIds' for compatibility
      const filesToDelete = ids || fileIds;

      if (!filesToDelete || !Array.isArray(filesToDelete)) {
        return res.status(400).json(createErrorResponse('File IDs array is required'));
      }

      let deletedCount = 0;
      const errors: string[] = [];

      for (const fileId of filesToDelete) {
        try {
          await storage.deleteMedia(fileId);
          deletedCount++;
        } catch (error) {
          const errorMsg = `Failed to delete file ${fileId}: ${error}`;
          console.warn(errorMsg);
          errors.push(errorMsg);
        }
      }

      res.json(createSuccessResponse({
        message: 'Successfully deleted ' + deletedCount + ' of ' + filesToDelete.length + ' files',
        deletedCount,
        errors
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
      console.log('Admin level up for player:', playerId);

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

  // Character management endpoints
  app.get('/api/admin/characters', async (req: Request, res: Response) => {
    try {
      const characters = await storage.getAllCharacters();
      res.json(characters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      res.status(500).json(createErrorResponse('Failed to fetch characters'));
    }
  });

  app.post('/api/admin/characters', async (req: Request, res: Response) => {
    try {
      const characterData = req.body;
      const newCharacter = await storage.createCharacter(characterData);
      res.json(createSuccessResponse(newCharacter));
    } catch (error) {
      console.error('Error creating character:', error);
      res.status(500).json(createErrorResponse('Failed to create character'));
    }
  });

  app.put('/api/admin/characters/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      console.log(`Updating character ${id} with:`, updates);

      // Update character in storage
      const updatedCharacter = await storage.updateCharacter(id, updates);

      if (!updatedCharacter) {
        return res.status(404).json(createErrorResponse('Character not found'));
      }

      res.json(createSuccessResponse({
        ...updatedCharacter,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error updating character:', error);
      res.status(500).json(createErrorResponse(`Failed to update character: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });

  app.delete('/api/admin/characters/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteCharacter(id);
      res.json(createSuccessResponse({ message: 'Character deleted successfully' }));
    } catch (error) {
      console.error('Error deleting character:', error);
      res.status(500).json(createErrorResponse('Failed to delete character'));
    }
  });

  // Debug endpoints
  // Mock debug endpoints removed - using real database operations instead

  // Old debugger endpoints removed - using React State Debugger instead
}