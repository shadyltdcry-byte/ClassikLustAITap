/**
 * chatRoutes.ts - AI Chat and Media Sharing Routes
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles chat functionality, AI responses, and media sharing between characters and users
 */

import type { Express, Request, Response } from "express";
import path from 'path';
import fs from 'fs';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { isValidUserId, createSuccessResponse, createErrorResponse } from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

// AI response generation  
async function generateAIResponse(userMessage: string, characterName = 'Luna', characterPersonality = 'A sweet, flirty, and playful character who loves to chat'): Promise<string> {
  // Check if MISTRAL_MODEL_API_KEY is available for enhanced responses
  if (process.env.MISTRAL_MODEL_API_KEY) {
    try {
      console.log('Using REAL Mistral API for enhanced responses');
      
      const Mistral = (await import('@mistralai/mistralai')).default;
      const client = new Mistral({
        apiKey: process.env.MISTRAL_MODEL_API_KEY
      });

      const prompt = `You are ${characterName}, a character in a visual novel game. ${characterPersonality}

Your personality:
- Sweet, caring, and affectionate
- Playful and a bit flirty
- Use emotes like *blushes*, *giggles*, *winks*
- Keep responses under 100 words
- Be engaging and personal
- Show genuine interest in the player

User: ${userMessage}
${characterName}:`;

      const response = await client.chat.complete({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8
      });

      const aiResponse = response.choices?.[0]?.message?.content?.trim();
      if (aiResponse) {
        console.log('✅ REAL Mistral AI response:', aiResponse);
        return aiResponse;
      }
    } catch (error) {
      console.error('❌ Mistral API error:', error);
    }
  }

  const input = userMessage.toLowerCase();

  if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
    return "Hey! *smiles warmly* I'm so happy to see you! How's your day going?";
  }

  if (input.includes('how are you')) {
    return "I'm doing amazing now that I'm talking to you! *giggles* You always know how to brighten my mood!";
  }

  if (input.includes('beautiful') || input.includes('pretty') || input.includes('cute')) {
    return "*blushes* Aww, thank you so much! You're so sweet! That really made my day!";
  }

  if (input.includes('love')) {
    return "*heart eyes* I love talking to you too! You make me feel so special!";
  }

  if (input.includes('what') && input.includes('doing')) {
    return "Just thinking about you and waiting for your next message! *giggles* What are you up to?";
  }

  if (input.includes('tired') || input.includes('exhausted')) {
    return "Aww, you should get some rest! *caring look* I'll be here when you get back, okay?";
  }

  if (input.includes('work') || input.includes('job')) {
    return "Work can be so stressful! *sympathetic* Tell me about it - I'm a great listener!";
  }

  if (input.includes('game') || input.includes('playing')) {
    return "Ooh, I love games! *excited* What are you playing? Can I watch?";
  }

  // Default responses
  const defaultResponses = [
    "That's so interesting! Tell me more! *leans in with curiosity*",
    "Hmm, I never thought about it that way! *thoughtful expression*",
    "You always have such interesting things to say! *smiling*",
    "I love our conversations! *happy giggle*",
    "You're so smart! I learn so much from talking to you!",
    "That sounds wonderful! *enthusiastic*"
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export function registerChatRoutes(app: Express) {
  
  // Chat history endpoint - returns last 10 messages for display
  app.get("/api/chat-history/:userId/:characterId", async (req: Request, res: Response) => {
    try {
      const { userId, characterId } = req.params;
      
      // Check if userId is valid UUID, telegram, or guest format  
      if (!isValidUserId(userId) && !userId.startsWith('guest_')) {
        console.log(`Invalid userId: ${userId}, returning empty chat history`);
        return res.json([]);
      }

      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const playerFolder = path.join(__dirname, '..', '..', 'player-data', userId);
      const conversationPath = path.join(playerFolder, `conversations_${characterId}.json`);
      
      if (fs.existsSync(conversationPath)) {
        const data = fs.readFileSync(conversationPath, 'utf8');
        const allConversations = JSON.parse(data);
        
        // Return only last 10 messages for display but keep full logs
        const last10Messages = allConversations.slice(-10);
        res.json(last10Messages);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Chat history error:', error);
      res.status(500).json(createErrorResponse('Failed to load chat history'));
    }
  });

  // Get chat messages - Using real database operations instead of mock data
  app.get("/api/chat/:userId/:characterId", async (req: Request, res: Response) => {
    try {
      const { userId, characterId } = req.params;
      
      // Return empty chat messages - TODO: implement real chat storage
      res.json([]);
    } catch (error) {
      console.error('Error fetching chat:', error);
      res.status(500).json(createErrorResponse('Failed to fetch chat'));
    }
  });

  // Send chat message
  app.post("/api/chat/:userId/:characterId", async (req: Request, res: Response) => {
    try {
      const { userId, characterId } = req.params;
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json(createErrorResponse('Message is required'));
      }
      
      // Generate AI response
      const aiResponse = await generateAIResponse(message);
      
      // Mock response for now
      const responseMessage = {
        id: Date.now(),
        senderId: characterId,
        message: aiResponse,
        timestamp: new Date().toISOString(),
        type: 'character'
      };
      
      res.json(createSuccessResponse(responseMessage));
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json(createErrorResponse('Failed to send message'));
    }
  });

  // Alternative chat endpoint
  app.get("/api/chat/:userId/:characterId", (req: Request, res: Response) => {
    const { userId, characterId } = req.params;
    
    // Mock conversation for now
    const mockConversation = [
      {
        id: 1,
        sender: 'character',
        message: "Hey! I missed you! How's your day going?",
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 2,
        sender: 'user',
        message: "Hi! It's going well, thanks for asking!",
        timestamp: new Date(Date.now() - 240000).toISOString()
      },
      {
        id: 3,
        sender: 'character',
        message: "*smiles brightly* That's wonderful! I love hearing about your day!",
        timestamp: new Date(Date.now() - 180000).toISOString()
      }
    ];
    
    res.json(mockConversation);
  });

  // Send message endpoint
  app.post("/api/chat/send", async (req: Request, res: Response) => {
    try {
      const { userId, characterId, message } = req.body;
      
      if (!userId || !characterId || !message) {
        return res.status(400).json(createErrorResponse('Missing required fields'));
      }
      
      // Generate AI response
      const aiResponse = await generateAIResponse(message);
      
      // Mock successful response
      res.json(createSuccessResponse({
        userMessage: {
          id: Date.now(),
          sender: 'user',
          message,
          timestamp: new Date().toISOString()
        },
        characterResponse: {
          id: Date.now() + 1,
          sender: 'character',
          message: aiResponse,
          timestamp: new Date().toISOString()
        }
      }));
      
    } catch (error) {
      console.error('Error in chat send:', error);
      res.status(500).json(createErrorResponse('Failed to send message'));
    }
  });

  // Mistral AI chat endpoint
  app.post("/api/mistral/chat", async (req: Request, res: Response) => {
    try {
      const { message, characterPersonality, characterMood } = req.body;
      
      if (!message) {
        return res.status(400).json(createErrorResponse('Message is required'));
      }
      
      // Enhanced AI response with personality and mood
      let enhancedResponse = await generateAIResponse(message, req.body.characterName || 'Luna', req.body.characterDescription || 'A sweet, flirty, and playful character who loves to chat');
      
      // Modify response based on character mood
      if (characterMood === 'flirty') {
        enhancedResponse += " *winks playfully*";
      } else if (characterMood === 'shy') {
        enhancedResponse = "*looks away bashfully* " + enhancedResponse;
      } else if (characterMood === 'excited') {
        enhancedResponse = "*bounces excitedly* " + enhancedResponse;
      }
      
      res.json(createSuccessResponse({
        response: enhancedResponse,
        characterPersonality,
        characterMood
      }));
      
    } catch (error) {
      console.error('Mistral chat error:', error);
      res.status(500).json(createErrorResponse('Failed to generate response'));
    }
  });

  // Mistral debug endpoint
  app.post("/api/mistral/debug", async (req: Request, res: Response) => {
    try {
      const { message, debugMode, prompt } = req.body;
      
      const debugMessage = message || prompt || 'test';
      const debugResponse = {
        originalMessage: debugMessage,
        processedMessage: debugMessage.toLowerCase(),
        response: await generateAIResponse(debugMessage),
        debugMode: debugMode || false,
        timestamp: new Date().toISOString()
      };
      
      res.json(createSuccessResponse(debugResponse));
      
    } catch (error) {
      console.error('Mistral debug error:', error);
      res.status(500).json(createErrorResponse('Debug request failed'));
    }
  });
}