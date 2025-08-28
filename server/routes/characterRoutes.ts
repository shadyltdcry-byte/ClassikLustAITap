/**
 * characterRoutes.ts - Character Management Routes
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles character selection, gallery management, and character data
 */

import type { Express, Request, Response } from "express";
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { createSuccessResponse, createErrorResponse, getDefaultCharacter } from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

export function registerCharacterRoutes(app: Express) {

  // Get all available characters
  app.get("/api/characters", async (req: Request, res: Response) => {
    try {
      const characters = await storage.getAllCharacters();
      
      // If no characters found, return default character
      if (!characters || characters.length === 0) {
        const defaultCharacter = getDefaultCharacter();
        return res.json([defaultCharacter]);
      }
      
      res.json(characters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      
      // Fallback to default character on error
      const defaultCharacter = getDefaultCharacter();
      res.json([defaultCharacter]);
    }
  });

  // Create new character
  app.post("/api/characters", async (req: Request, res: Response) => {
    try {
      const characterData = req.body;
      
      // Validate required fields
      if (!characterData.name) {
        return res.status(400).json(createErrorResponse('Character name is required'));
      }
      
      const newCharacter = await storage.createCharacter(characterData);
      res.json(createSuccessResponse(newCharacter));
      
    } catch (error) {
      console.error('Error creating character:', error);
      res.status(500).json(createErrorResponse('Failed to create character'));
    }
  });

  // Get selected character for player
  app.get("/api/character/selected/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      let selectedCharacter = await storage.getSelectedCharacter(playerId);

      // If no character is selected, automatically select the first enabled character
      if (!selectedCharacter) {
        const allCharacters = await storage.getAllCharacters();
        const enabledCharacters = allCharacters.filter(char => char.isEnabled);
        
        if (enabledCharacters.length > 0) {
          const firstCharacter = enabledCharacters[0];
          await storage.selectCharacter(playerId, firstCharacter.id);
          selectedCharacter = firstCharacter;
        } else {
          // Return default character if no characters available
          selectedCharacter = getDefaultCharacter();
        }
      }

      res.json(selectedCharacter);
    } catch (error) {
      console.error('Error fetching selected character:', error);
      
      // Fallback to default character
      const defaultCharacter = getDefaultCharacter();
      res.json(defaultCharacter);
    }
  });

  // Select character for player
  app.post('/api/player/:playerId/select-character', async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const { characterId } = req.body;
      
      if (!characterId) {
        return res.status(400).json(createErrorResponse('Character ID is required'));
      }
      
      // Set selected character for player
      await storage.setSelectedCharacter(playerId, characterId);
      
      res.json(createSuccessResponse({ characterId }));
    } catch (error) {
      console.error('Error selecting character:', error);
      res.status(500).json(createErrorResponse('Failed to select character'));
    }
  });

  // Get media for specific character
  app.get("/api/media/character/:characterId", async (req: Request, res: Response) => {
    try {
      const { characterId } = req.params;
      const characterMedia = await storage.getMediaByCharacter(characterId);
      
      res.json(characterMedia || []);
    } catch (error) {
      console.error('Error fetching character media:', error);
      res.json([]); // Return empty array on error
    }
  });

  // Admin character management routes
  app.get('/api/admin/characters', (req: Request, res: Response) => {
    // Mock admin character data for now
    res.json([]);
  });

  app.put('/api/admin/characters/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Mock character update for now
      console.log(`Updating character ${id} with:`, updates);
      
      res.json(createSuccessResponse({
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error updating character:', error);
      res.status(500).json(createErrorResponse('Failed to update character'));
    }
  });

  app.delete('/api/admin/characters/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Mock character deletion for now
      console.log(`Deleting character ${id}`);
      
      res.json(createSuccessResponse({ message: 'Character deleted successfully' }));
    } catch (error) {
      console.error('Error deleting character:', error);
      res.status(500).json(createErrorResponse('Failed to delete character'));
    }
  });
}