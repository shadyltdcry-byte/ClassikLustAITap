import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCharacterSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { openaiService } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/user/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Character routes
  app.get("/api/characters", async (req, res) => {
    try {
      const characters = await storage.getCharacters();
      res.json(characters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch characters", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/user/:userId/characters", async (req, res) => {
    try {
      const userCharacters = await storage.getUserCharacters(req.params.userId);
      res.json(userCharacters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user characters", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/user/:userId/characters/:characterId/unlock", async (req, res) => {
    try {
      const userCharacter = await storage.unlockCharacter({
        userId: req.params.userId,
        characterId: req.params.characterId,
      });
      res.status(201).json(userCharacter);
    } catch (error) {
      res.status(400).json({ message: "Failed to unlock character", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Upgrade routes
  app.get("/api/upgrades", async (req, res) => {
    try {
      const upgrades = await storage.getUpgrades();
      res.json(upgrades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upgrades", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/user/:userId/upgrades", async (req, res) => {
    try {
      const userUpgrades = await storage.getUserUpgrades(req.params.userId);
      res.json(userUpgrades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user upgrades", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/user/:userId/upgrades", async (req, res) => {
    try {
      const upgradeData = {
        userId: req.params.userId,
        upgradeId: req.body.upgradeId,
        level: req.body.level || 1,
      };
      const userUpgrade = await storage.purchaseUpgrade(upgradeData);
      res.status(201).json(userUpgrade);
    } catch (error) {
      res.status(400).json({ message: "Failed to purchase upgrade", error: error.message });
    }
  });

  // Game mechanics routes
  app.post("/api/user/:userId/tap", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.energy < 1) {
        return res.status(400).json({ message: "Not enough energy" });
      }

      // Calculate LP gain based on user's lpPerTap and any active boosters
      const activeBooters = await storage.getActiveBooters(req.params.userId);
      let lpMultiplier = 1;
      activeBooters.forEach(booster => {
        if (booster.type === "lp_multiplier") {
          lpMultiplier *= booster.multiplier;
        }
      });

      const lpGain = Math.floor(user.lpPerTap * lpMultiplier);
      
      // Update user stats
      const updatedUser = await storage.updateUser(req.params.userId, {
        lp: user.lp + lpGain,
        energy: user.energy - 1,
      });

      // Update game stats
      const stats = await storage.getGameStats(req.params.userId);
      if (stats) {
        await storage.updateGameStats(req.params.userId, {
          totalTaps: stats.totalTaps + 1,
          totalLpEarned: stats.totalLpEarned + lpGain,
          totalEnergyUsed: stats.totalEnergyUsed + 1,
        });
      }

      res.json({ user: updatedUser, lpGain });
    } catch (error) {
      res.status(500).json({ message: "Failed to process tap", error: error.message });
    }
  });

  app.post("/api/user/:userId/tick", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const now = new Date();
      const lastTick = new Date(user.lastTick);
      const timeDiff = now.getTime() - lastTick.getTime();
      const hoursPassed = timeDiff / (1000 * 60 * 60);

      if (hoursPassed < 0.1) { // Less than 6 minutes
        return res.json({ user, lpGained: 0, energyRestored: 0 });
      }

      // Calculate offline LP gain (capped at 2 hours max)
      const maxOfflineHours = 2;
      const effectiveHours = Math.min(hoursPassed, maxOfflineHours);
      const lpGained = Math.floor(effectiveHours * user.lpPerHour);

      // Calculate energy restoration (1 energy per 3 seconds)
      const energyRestored = Math.min(
        Math.floor(timeDiff / 3000),
        user.maxEnergy - user.energy
      );

      const updatedUser = await storage.updateUser(req.params.userId, {
        lp: user.lp + lpGained,
        energy: Math.min(user.energy + energyRestored, user.maxEnergy),
      });

      res.json({ user: updatedUser, lpGained, energyRestored });
    } catch (error) {
      res.status(500).json({ message: "Failed to process tick", error: error.message });
    }
  });

  // Chat routes
  app.get("/api/user/:userId/character/:characterId/chat", async (req, res) => {
    try {
      const chatHistory = await storage.getChatHistory(req.params.userId, req.params.characterId);
      res.json(chatHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history", error: error.message });
    }
  });

  app.post("/api/user/:userId/character/:characterId/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      // Get character info for AI context
      const character = await storage.getCharacter(req.params.characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Get user character relationship
      const userCharacter = await storage.getUserCharacter(req.params.userId, req.params.characterId);
      
      // Generate AI response
      const response = await openaiService.generateCharacterResponse(
        message,
        character,
        userCharacter
      );

      // Calculate charisma gain
      const charismaGained = Math.floor(Math.random() * 10) + 1;

      // Save chat message
      const chatMessage = await storage.saveChatMessage({
        userId: req.params.userId,
        characterId: req.params.characterId,
        message,
        response,
        charismaGained,
      });

      // Update user charisma
      const user = await storage.getUser(req.params.userId);
      if (user) {
        await storage.updateUser(req.params.userId, {
          charisma: user.charisma + charismaGained,
        });
      }

      res.json(chatMessage);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message", error: error.message });
    }
  });

  // Wheel routes
  app.post("/api/user/:userId/wheel/spin", async (req, res) => {
    try {
      const cost = 500; // Wheel spin cost
      const user = await storage.getUser(req.params.userId);
      
      if (!user || user.lp < cost) {
        return res.status(400).json({ message: "Insufficient LP" });
      }

      const reward = await storage.spinWheel(req.params.userId, cost);
      res.json(reward);
    } catch (error) {
      res.status(500).json({ message: "Failed to spin wheel", error: error.message });
    }
  });

  // Admin routes
  app.post("/api/admin/user/:userId/add-lp", async (req, res) => {
    try {
      const { amount } = req.body;
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(req.params.userId, {
        lp: user.lp + amount,
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to add LP", error: error.message });
    }
  });

  app.post("/api/admin/user/:userId/max-energy", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(req.params.userId, {
        energy: user.maxEnergy,
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to restore energy", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
