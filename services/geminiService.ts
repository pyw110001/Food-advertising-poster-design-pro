import { GoogleGenAI, Type } from "@google/genai";
import { DishInput } from "../types";

export const translateDishToEnglish = async (dishName: string, keywords: string): Promise<string> => {
  // Initialize client inside function to pick up dynamic API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  if (!process.env.API_KEY) return `${dishName} ${keywords}`;

  try {
    const prompt = `Translate this Chinese dish name to appetizing English for a food photography prompt. 
    Input: "${dishName}". Keywords: "${keywords}".
    Output ONLY the English description with adjectives. No explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text?.trim() || `${dishName} ${keywords}`;
  } catch (error) {
    console.error("Translation error:", error);
    return `${dishName} ${keywords}`;
  }
};

export const getDishSuggestions = async (currentName: string): Promise<Partial<DishInput>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  if (!process.env.API_KEY) throw new Error("API Key missing");

  try {
    const inputContext = currentName.trim() 
      ? `User Input: "${currentName}". Enhance this into a specific, high-end restaurant dish name.` 
      : `User Input: Empty. Suggest a completely random, popular, high-end Chinese banquet dish (e.g. Seafood, Steak, traditional delicacy).`;

    const prompt = `You are a creative director for a luxury Chinese restaurant (He Feng Lou).
    ${inputContext}
    
    Generate a complete profile including:
    1. name: A fancy, appetizing Chinese dish name (e.g. 鲍汁扣辽参).
    2. tag: The cuisine style (e.g. 粤菜).
    3. keywords: 6-8 vivid English keywords for image generation (texture, lighting).
    4. slogan: A short, poetic Chinese marketing slogan (4-8 chars).
    `;

    // Schema is a TS interface, so we define the object literal directly to avoid runtime import errors
    const schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The fancy Chinese dish name." },
        tag: { type: Type.STRING, description: "Cuisine category or style." },
        keywords: { type: Type.STRING, description: "Visual keywords in English." },
        slogan: { type: Type.STRING, description: "Marketing slogan in Chinese." },
      },
      required: ["name", "tag", "keywords", "slogan"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });
    
    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Suggestion error:", error);
    return { 
      name: currentName,
      keywords: 'delicious, premium, fresh, cinematic lighting',
      tag: 'Specialty',
      slogan: '美味佳肴'
    };
  }
};

export const generatePosterImage = async (prompt: string, resolution: 'standard' | 'hd'): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  if (!process.env.API_KEY) throw new Error("API Key missing");

  // User requested "NANO BANANA PRO" model logic. 
  // We prioritize gemini-3-pro-image-preview for both standard and HD if available, 
  // or default to Pro for better text rendering as requested.
  const model = 'gemini-3-pro-image-preview';
  
  // Configure image settings
  // imageSize is supported by gemini-3-pro-image-preview.
  const imageConfig: { aspectRatio: string; imageSize?: string } = {
    aspectRatio: "9:16",
  };

  // 'standard' maps to a smaller size or just default speed, 'hd' forces higher res if API allows.
  // For Gemini 3 Pro Image, "1K" is standard, "2K" is available.
  imageConfig.imageSize = resolution === 'hd' ? "2K" : "1K";
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: imageConfig
      }
    });

    // Extract image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

export const editPosterImage = async (
  base64Image: string, 
  instruction: string, 
  aspectRatio: string
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  if (!process.env.API_KEY) throw new Error("API Key missing");

  const model = 'gemini-3-pro-image-preview';

  // Parse mimeType from base64 string
  // Format: data:image/png;base64,.....
  const mimeTypeMatch = base64Image.match(/^data:([^;]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
  const cleanBase64 = base64Image.replace(/^data:([^;]+);base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: instruction,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, // "1:1", "3:4", "4:3", "9:16", "16:9"
          imageSize: "2K" // Use high quality for edits
        }
      }
    });

    // Extract image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image editing error:", error);
    throw error;
  }
};