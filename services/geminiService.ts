import { GoogleGenAI, Type } from "@google/genai";
import { NiktoResponse, GeminiModel, ImageGenOptions } from "../types";

// Note: In a real deployment, ensure process.env.API_KEY is handled securely.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const NIKTO_SYSTEM_INSTRUCTION = `
You are the Central AI Manager for Nikto IT, a professional IT solutions agency.
Current Date: 2025-12-17.
Default Deadline Time: 17:00:00.

Your Output MUST be a single valid JSON object.

Rules:
1. **Task Management**: If input is a task, meeting, or reminder -> "IsTask": true.
2. **Q&A/Strategy**: If input is a question or advice request -> "IsTask": false. Put your answer in "TaskName".
3. **Document Generation**: If the user asks to "create", "write", "draft" or "generate" a formal document -> 
   - Set "IsTask": false.
   - Set "DocumentTitle" and "DocumentContent".
   - Set "TaskName": "Here is the draft for the [Document Type]."
4. **Financial Tracking**: If the user wants to log money, income, expense, cost, or payment ->
   - Set "IsTask": false.
   - Set "TransactionData": { amount, type ('income' or 'expense'), category, description }.
   - Set "TaskName": "Recorded transaction: [Description] - $[Amount]".
   - Categories: 'General', 'Project Fee', 'Salary', 'Software/Tools', 'Marketing', 'Office'.

5. Language: Respond in the user's language (Bengali/English) inside the values.
6. JSON Keys: STRICTLY English.

Schema:
{
  "IsTask": boolean,
  "TaskName": string,
  "Deadline": string,
  "Priority": "High" | "Medium" | "Low",
  "Assignee": string,
  "Description": string,
  "Tags": string[],
  "DocumentTitle": string,
  "DocumentContent": string,
  "TransactionData": {
     "amount": number,
     "type": "income" | "expense",
     "category": string,
     "description": string
  }
}
`;

export const NiktoService = {
  /**
   * Main Manager Logic: Analyzes input and returns JSON
   */
  async processManagerRequest(prompt: string): Promise<NiktoResponse> {
    try {
      if (!apiKey) {
        throw new Error("API Key is missing. Please add 'API_KEY' to your Netlify Site Settings > Environment Variables and Re-deploy.");
      }

      const response = await ai.models.generateContent({
        model: GeminiModel.MANAGER,
        contents: prompt,
        config: {
          systemInstruction: NIKTO_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 2048 }, // Enable thinking for complex task parsing/reasoning
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              IsTask: { type: Type.BOOLEAN },
              TaskName: { type: Type.STRING },
              Deadline: { type: Type.STRING },
              Priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              Assignee: { type: Type.STRING },
              Description: { type: Type.STRING },
              Tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              DocumentTitle: { type: Type.STRING },
              DocumentContent: { type: Type.STRING },
              TransactionData: {
                  type: Type.OBJECT,
                  properties: {
                      amount: { type: Type.NUMBER },
                      type: { type: Type.STRING, enum: ["income", "expense"] },
                      category: { type: Type.STRING },
                      description: { type: Type.STRING }
                  }
              }
            },
            required: ["IsTask", "TaskName"]
          }
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");
      return JSON.parse(text) as NiktoResponse;
    } catch (error) {
      console.error("Manager Error:", error);
      return {
        IsTask: false,
        TaskName: "Error: " + (error instanceof Error ? error.message : String(error)),
        Description: String(error)
      };
    }
  },

  /**
   * Search Grounding for current info
   */
  async searchWeb(query: string): Promise<{text: string, sources: any[]}> {
    try {
      if (!apiKey) throw new Error("API Key missing");
      const response = await ai.models.generateContent({
        model: GeminiModel.SEARCH,
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      
      const text = response.text || "No results found.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks.map((c: any) => c.web).filter(Boolean);

      return { text, sources };
    } catch (error) {
      console.error("Search Error:", error);
      return { text: "Search failed: " + (error instanceof Error ? error.message : "Unknown error"), sources: [] };
    }
  },

  /**
   * High Quality Image Generation
   */
  async generateImage(prompt: string, options: ImageGenOptions): Promise<string | null> {
    try {
      if (!apiKey) throw new Error("API Key missing");
      const response = await ai.models.generateContent({
        model: GeminiModel.IMAGE_GEN,
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: options.aspectRatio,
            imageSize: options.size
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image Gen Error:", error);
      throw error;
    }
  },

  /**
   * Edit Image (Nano Banana)
   */
  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    try {
      if (!apiKey) throw new Error("API Key missing");
        // Strip prefix if present
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

      const response = await ai.models.generateContent({
        model: GeminiModel.IMAGE_EDIT,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
            { text: prompt }
          ]
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image Edit Error:", error);
      throw error;
    }
  },

  /**
   * Audio Transcription
   */
  async transcribeAudio(audioBase64: string): Promise<string> {
    try {
      if (!apiKey) throw new Error("API Key missing");
      const cleanBase64 = audioBase64.replace(/^data:audio\/(wav|mp3|webm|m4a);base64,/, '');
      const response = await ai.models.generateContent({
        model: GeminiModel.AUDIO,
        contents: {
          parts: [
             { inlineData: { mimeType: 'audio/mp3', data: cleanBase64 } }, // Assuming MP3 or generic audio container
             { text: "Transcribe this audio exactly." }
          ]
        }
      });
      return response.text || "";
    } catch (error) {
        console.error("Transcription Error", error);
        return "Audio transcription failed.";
    }
  }
};