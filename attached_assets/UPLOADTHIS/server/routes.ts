 /** * routes.ts
 * Last Edited: 2025-08-17 by Steven
 *
 *
 * 
 * 
 *
 * Please leave a detailed description
 *      of each function you add
 */

import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import fsSync from "fs";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertCharacterSchema,
  insertUpgradeSchema,
  insertChatMessageSchema,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { mistralService } from "./mistralService";
import crypto from "crypto";




      // Create data check string
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

      // Create secret key
      const secretKey = crypto
        .createHmac("sha256", "WebAppData")
        .update(BOT_TOKEN)
        .digest();

      // Calculate hash
      const calculatedHash = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

      if (calculatedHash !== hash) {
        throw new Error("Invalid hash");
      }

      // Parse user data
      const userString = urlParams.get("user");
      if (userString) {
        return JSON.parse(userString);
      }

      return null;
    } catch (error) {
      console.error("Telegram verification error:", error);
      return null;
    }
  }

  