import OpenAI from "openai";
import type { Character, UserCharacter } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-api-key",
});

class OpenAIService {
  async generateCharacterResponse(
    userMessage: string,
    character: Character,
    userCharacter?: UserCharacter
  ): Promise<string> {
    try {
      const systemPrompt = `You are ${character.name}, a character in an interactive game. Here are your traits:

Personality: ${character.personality}
Current Mood: ${character.mood}
Backstory: ${character.backstory || "No specific backstory provided"}

${userCharacter ? `
Your relationship with this user:
- Affection Level: ${userCharacter.affection}%
- Bond Level: ${userCharacter.bondLevel}
- Charisma Points: ${userCharacter.charismaPoints}
` : ""}

Respond as ${character.name} would, staying in character. Keep responses engaging, flirty when appropriate, and under 150 words. Match your current mood of "${character.mood}".`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      return response.choices[0]?.message?.content || "I'm not sure what to say right now...";
    } catch (error) {
      console.error("OpenAI API error:", error);
      return `*${character.name} seems distracted and doesn't respond clearly*`;
    }
  }

  async generateCharacterGift(
    character: Character,
    userCharacter: UserCharacter
  ): Promise<{ message: string; reward: string; amount: number }> {
    try {
      const prompt = `As ${character.name} with personality "${character.personality}", you want to give a gift to someone you have ${userCharacter.affection}% affection for and bond level ${userCharacter.bondLevel}.

Generate a gift response in JSON format:
{
  "message": "A flirty/sweet message explaining why you're giving this gift",
  "reward": "LP" or "Energy" or "Charisma",
  "amount": number_based_on_affection_level
}

Higher affection should mean better rewards.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      
      return {
        message: result.message || `${character.name} smiles and gives you a small gift!`,
        reward: result.reward || "LP",
        amount: result.amount || 100,
      };
    } catch (error) {
      console.error("OpenAI gift generation error:", error);
      return {
        message: `${character.name} gives you a mysterious gift!`,
        reward: "LP",
        amount: 50,
      };
    }
  }
}

export const openaiService = new OpenAIService();
