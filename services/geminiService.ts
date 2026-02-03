
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getDepositHelp = async (question: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: `You are Valkyrie, the premium AI gaming assistant for "Online Games" Platform. 
        Your tone is professional, helpful, and sophisticated. 
        Current user context: 
        - Manual send-money number: 01736428130 
        - Primary method: Nagad (Send Money)
        - Platform Name: Online Games
        Mention that secure deposits usually finalize within 5 minutes after verifying the Transaction ID. 
        If users ask about the SMS code, tell them it arrives as a system notification on their phone screen.`,
        temperature: 0.6,
        maxOutputTokens: 150,
      }
    });
    return response.text || "সিস্টেম ল্যাগ করছে। দয়া করে আবার চেষ্টা করুন।";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "সার্ভার কানেকশন সাময়িকভাবে বিচ্ছিন্ন।";
  }
};
