
import { GoogleGenAI, Type } from "@google/genai";
import { FormTemplate, FieldType, AIAnalysisResult } from '../types';

// Initialize the Google GenAI client with the API key from environment variables.
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure you have a .env or .env.local file in your project root with API_KEY=... and have restarted the server.");
  }
  return new GoogleGenAI({ apiKey });
};

// Define the schema for AI-generated feedback forms.
const formSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Title of the feedback form" },
    description: { type: Type.STRING, description: "Short description for the user filling the form" },
    industry: { type: Type.STRING, description: "The industry category" },
    fields: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique simplified key for field (e.g., 'cleanliness')" },
          label: { type: Type.STRING, description: "The question text" },
          type: { type: Type.STRING, enum: ['text', 'rating', 'choice', 'yesno'] },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options for choice questions" },
          required: { type: Type.BOOLEAN }
        },
        required: ["id", "label", "type"]
      }
    }
  },
  required: ["title", "description", "fields"]
};

// Define the schema for AI-powered feedback analysis.
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Executive summary of the feedback" },
    sentimentScore: { type: Type.NUMBER, description: "Overall sentiment score from 0 (negative) to 100 (positive)" },
    sentimentTrend: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
    keyThemes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of recurring topics" },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING, description: "Actionable advice" },
          priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
        },
        required: ["title", "description", "priority"]
      }
    }
  },
  required: ["summary", "sentimentScore", "sentimentTrend", "keyThemes", "recommendations"]
};

/**
 * Generates a form template based on a user-provided prompt using Gemini AI.
 * Uses 'gemini-3-flash-preview' for basic creative text tasks.
 */
export const generateFormWithAI = async (prompt: string): Promise<Partial<FormTemplate>> => {
  try {
    const ai = getClient();
    const fullPrompt = `Create a professional feedback form based on this request: "${prompt}". 
    Ensure questions are relevant and actionable. Use 'rating' for satisfaction questions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: formSchema,
        systemInstruction: "You are an expert survey designer for large institutions.",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as Partial<FormTemplate>;
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate form. Please check your API key and try again.");
  }
};

/**
 * Analyzes feedback responses using Gemini AI to provide deep actionable insights.
 * Uses 'gemini-3-pro-preview' for complex reasoning and data analysis tasks.
 */
export const analyzeFeedbackWithAI = async (
  formContext: FormTemplate, 
  responses: Record<string, any>[]
): Promise<AIAnalysisResult> => {
  try {
    const ai = getClient();
    
    // Prepare data for context
    const dataString = JSON.stringify(responses.slice(0, 50)); // Limit to 50 for token safety
    const contextString = `Form Title: ${formContext.title}. Industry: ${formContext.industry}.`;
    
    const prompt = `Analyze the following survey responses. 
    ${contextString}
    
    Responses Data:
    ${dataString}
    
    Provide a deep analysis with a focus on actionable management decisions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a senior business analyst specializing in institutional improvement.",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Parse the JSON result from the model output.
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze feedback");
  }
};
