
import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, QuizQuestion, ConceptMapNode } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Helper to construct the API payload with text, optional context, and optional images.
 */
const buildContents = (promptText: string, mainContent: string, context?: string, images?: string[]) => {
  const parts: any[] = [];
  
  // 1. Instructions & Main Content
  let fullText = `${promptText}\n\n=== MAIN STUDY MATERIAL ===\n${mainContent.substring(0, 30000)}`;

  // 2. Add Context if exists
  if (context) {
    fullText += `\n\n=== CONTEXT / RUBRIC / GRADING CRITERIA ===\n${context.substring(0, 10000)}`;
  }

  parts.push({ text: fullText });

  // 3. Add Images if exist
  if (images && images.length > 0) {
    images.forEach(base64 => {
      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = base64.split(',')[1] || base64;
      parts.push({
        inlineData: {
          mimeType: 'image/png', // Assuming PNG/JPEG, API is flexible usually
          data: cleanBase64
        }
      });
    });
  }

  return { parts };
};

export const generateSummary = async (text: string, context?: string, images?: string[]): Promise<string> => {
  const prompt = `
    You are an expert study assistant. 
    Create a comprehensive study guide/summary for the provided material.
    
    CRITICAL: If a Rubric or Context is provided, ensure the summary highlights sections that are most important based on that rubric.
    
    Format:
    - Use HTML <h3> for headers.
    - Use <ul><li> for bullet points.
    - Use <mark> tags to highlight specific key terms, dates, or crucial definitions.
    - Use <strong> for emphasis.
    - Keep it structured and easy to read.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: buildContents(prompt, text, context, images),
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error (Summary):", error);
    return "Failed to generate summary. Please try again.";
  }
};

export const generateFlashcards = async (text: string, context?: string, images?: string[]): Promise<Flashcard[]> => {
  const prompt = `
    Generate 10 high-quality flashcards.
    If context/rubric is provided, prioritize questions that align with the grading criteria.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: buildContents(prompt, text, context, images),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || "[]");
    return json.map((card: any, index: number) => ({
      id: `card-${Date.now()}-${index}`,
      front: card.front,
      back: card.back,
      status: 'new',
    }));
  } catch (error) {
    console.error("Gemini API Error (Cards):", error);
    return [];
  }
};

export const generateQuiz = async (text: string, context?: string, images?: string[]): Promise<QuizQuestion[]> => {
  const prompt = `
    Create a 10-minute quiz (approx 8 questions).
    Prioritize topics emphasized in the Context/Rubric if present.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: buildContents(prompt, text, context, images),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                }
            }
        }
      }
    });

    const json = JSON.parse(response.text || "[]");
    return json.map((q: any, index: number) => ({
      id: `quiz-${Date.now()}-${index}`,
      ...q
    }));
  } catch (error) {
    console.error("Gemini API Error (Quiz):", error);
    return [];
  }
};

export const generateConceptMap = async (text: string, context?: string, images?: string[]): Promise<ConceptMapNode> => {
    const prompt = `
      Create a hierarchical concept map of the main topics.
      The structure should be: Root Topic -> Main Concepts -> Details/Sub-concepts.
      
      Return a single Root Node object.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: buildContents(prompt, text, context, images),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                details: { type: Type.STRING },
                children: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            details: { type: Type.STRING },
                            children: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        label: { type: Type.STRING },
                                        details: { type: Type.STRING },
                                        children: { 
                                            type: Type.ARRAY, 
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    id: { type: Type.STRING },
                                                    label: { type: Type.STRING },
                                                    details: { type: Type.STRING }
                                                }
                                            } 
                                        } 
                                    }
                                }
                            }
                        }
                    }
                }
            }
          }
        }
      });
  
      const json = JSON.parse(response.text || "{}");
      // Fallback if empty
      if (!json.label) return { id: 'root', label: 'Main Topic', children: [] };
      return json;

    } catch (error) {
      console.error("Gemini API Error (Map):", error);
      return { id: 'error', label: 'Could not generate map', children: [] };
    }
  };

export const generateShortOverview = async (text: string, context?: string, images?: string[]): Promise<string> => {
    const prompt = `
      You are a helpful study buddy.
      Create a very concise, engaging overview of this study material.
      It should be a single paragraph (max 4-5 sentences) that describes exactly what the user will learn or practice from these notes.
      Use a friendly, encouraging tone.
      Do not use markdown like bold or headers, just plain text.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: buildContents(prompt, text, context, images),
      });
  
      return response.text || "Ready to study! This set covers your uploaded material.";
    } catch (error) {
      console.error("Gemini API Error (Overview):", error);
      return "Your study set is ready!";
    }
  };
