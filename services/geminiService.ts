
import { GoogleGenAI } from "@google/genai";

export const getDepositHelp = async (question: string) => {
  try {
    // Check if process.env is available, otherwise fail gracefully
    if (typeof process === 'undefined' || !process.env.API_KEY) {
      console.warn("API_KEY not found in environment.");
      return "সিস্টেম বর্তমানে অফলাইনে আছে। দয়া করে এডমিনকে জানান।";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: `You are Valkyrie, the premium AI assistant for "Online Games" Platform. 
        Current user context: 
        - Manual send-money number: 01736428130 
        - Primary method: Nagad (Send Money)
        - Platform Name: Online Games
        If users ask about the SMS code, tell them it appears as a system notification at the top of their screen.`,
        temperature: 0.6,
        maxOutputTokens: 200,
        thinkingConfig: { thinkingBudget: 50 },
      }
    });
    return response.text || "সিস্টেম ল্যাগ করছে। দয়া করে আবার চেষ্টা করুন।";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "সার্ভার কানেকশন সাময়িকভাবে বিচ্ছিন্ন।";
  }
};
