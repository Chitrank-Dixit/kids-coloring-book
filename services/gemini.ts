import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ImageSize } from '../types';

// Chat session storage
let chatSession: Chat | null = null;

// Helper to get AI instance
const getAI = () => {
  // process.env.API_KEY is injected by the environment after selection
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select a key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBookCover = async (theme: string, childName: string, size: ImageSize): Promise<string> => {
  const ai = getAI();
  // gemini-3-pro-image-preview (Nano Banana Pro)
  const model = 'gemini-3-pro-image-preview';
  
  const prompt = `A vibrant, colorful children's book cover illustration. 
  Subject: ${theme}. 
  Title text embedded in art: "${childName}'s Coloring Book". 
  Style: Cute, cartoonish, bright colors, high quality, appealing to children. 
  Composition: Centered subject with a fun background.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: size, 
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error("No image data returned for cover");
};

export const generateColoringPage = async (theme: string, pageIndex: number, size: ImageSize): Promise<string> => {
  const ai = getAI();
  const model = 'gemini-3-pro-image-preview';

  // Vary the prompt slightly based on page index to ensure distinct pages
  const variations = [
    `A central character or object related to ${theme}.`,
    `A full scene showing ${theme} in an environment.`,
    `A funny or cute interaction involving ${theme}.`,
    `A close-up detail view of ${theme}.`,
    `A pattern or group composition of ${theme}.`
  ];

  const variation = variations[pageIndex % variations.length];

  const prompt = `A clean, black and white coloring book page for children. 
  Subject: ${variation}
  Style: Thick, clean black lines on a pure white background. 
  No shading, no grayscale, no colors. High contrast line art suitable for coloring with crayons.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: size,
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error(`No image data returned for page ${pageIndex + 1}`);
};

export const getChatResponse = async (message: string, systemInstruction?: string): Promise<string> => {
  // Initialize chat session if it doesn't exist
  if (!chatSession) {
    const ai = getAI();
    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview', // Advanced text model
      config: {
        systemInstruction: systemInstruction || "You are a friendly AI assistant helping a child or parent create a coloring book. Be creative, encouraging, and keep answers concise and suitable for children.",
      },
    });
  }

  const response: GenerateContentResponse = await chatSession.sendMessage({ message });
  return response.text || "I couldn't think of a response right now.";
};

export const resetChat = () => {
  chatSession = null;
};