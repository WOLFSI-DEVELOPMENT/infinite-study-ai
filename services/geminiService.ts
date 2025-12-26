import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, QuizQuestion, StudyPlan } from '../types';

// Initialize Gemini Client
// In a real app, API Key should be handled securely via backend proxy.
// For this demo, we assume process.env.API_KEY is injected or handled by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

export const generateSummary = async (text: string, length: 'short' | 'medium' | 'detailed'): Promise<string> => {
  const prompt = `
    You are an expert study assistant. 
    Analyze the following text and provide a ${length} summary.
    Use bullet points for clarity. 
    Focus on key concepts and definitions.
    
    Text:
    ${text.substring(0, 30000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate summary.");
  }
};

export const generateFlashcards = async (text: string, count: number = 10): Promise<Flashcard[]> => {
  const prompt = `
    Generate ${count} flashcards from the provided text.
    Return a JSON array where each object has "front" (question/term) and "back" (answer/definition).
    Keep them concise.
    
    Text:
    ${text.substring(0, 30000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
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
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate flashcards.");
  }
};

export const generateQuiz = async (text: string, count: number = 5): Promise<QuizQuestion[]> => {
  const prompt = `
    Create a multiple-choice quiz with ${count} questions based on the text.
    Return a JSON array. Each object must have:
    - "question": string
    - "options": array of 4 strings
    - "correctAnswer": integer (0-3 index of the correct option)
    - "explanation": short string explaining why.
    
    Text:
    ${text.substring(0, 30000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
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
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate quiz.");
  }
};

export const generateStudyPlan = async (text: string, examDate: string, dailyMinutes: number): Promise<StudyPlan> => {
    const prompt = `
      Create a personalized study plan leading up to ${examDate}.
      The student has ${dailyMinutes} minutes available per day.
      Base the topics strictly on the provided text.
      
      Return a JSON object with a "schedule" property, which is an array of daily plans.
      Each daily plan should have:
      - "day": integer (1, 2, 3...)
      - "date": string (ISO date YYYY-MM-DD)
      - "topics": array of strings (topics to cover)
      - "activities": array of strings (e.g., "Read section X", "Review flashcards")
      - "durationMinutes": integer
      
      Start from tomorrow's date.
      
      Text Context:
      ${text.substring(0, 10000)}
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
           responseSchema: {
            type: Type.OBJECT,
            properties: {
                schedule: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.INTEGER },
                            date: { type: Type.STRING },
                            topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                            activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                            durationMinutes: { type: Type.INTEGER }
                        }
                    }
                }
            }
          }
        }
      });
  
      const json = JSON.parse(response.text || "{}");
      
      return {
        id: `plan-${Date.now()}`,
        materialId: '', // Filled by caller
        examDate,
        dailyMinutes,
        schedule: json.schedule || [],
        createdAt: Date.now()
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate study plan.");
    }
  };