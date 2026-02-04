
import { GoogleGenAI } from "@google/genai";

export const getDepositHelp = async (question: string) => {
  try {
    if (typeof process === 'undefined' || !process.env.API_KEY) {
      return "সিস্টেম বর্তমানে অফলাইনে আছে। দয়া করে এডমিনকে জানান।";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: `আপনি "Online Games" প্ল্যাটফর্মের প্রিমিয়াম AI সহকারী 'Valkyrie'। 
        ব্যবহারকারীর সব প্রশ্নের উত্তর বাংলায় দিন।
        সিস্টেম ডিটেইলস:
        - অ্যাডমিন নম্বর (Nagad Send Money): 01736428130 
        - প্রাথমিক পদ্ধতি: নগদ (সেন্ড মানি)
        - এসএমএস কোড না পেলে বলুন যে স্ক্রিনের উপরে নোটিফিকেশন হিসেবে আসবে।
        খুব বন্ধুসুলভ এবং পেশাদারভাবে কথা বলুন।`,
        temperature: 0.6,
        maxOutputTokens: 200,
      }
    });
    return response.text || "সিস্টেম ল্যাগ করছে। দয়া করে আবার চেষ্টা করুন।";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "সার্ভার কানেকশন সাময়িকভাবে বিচ্ছিন্ন। দয়া করে কিছুক্ষণ পর চেষ্টা করুন।";
  }
};
