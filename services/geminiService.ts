import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Recipe } from "../types";

const getClient = () => {
  // Use the environment variable provided by the runtime
  // Ensure API_KEY is present in your deployment environment variables
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Common safety settings to prevent blocking valid food content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// Function to analyze image and extract ingredients
export const identifyIngredientsFromImage = async (
  base64Image: string, 
  mimeType: string,
  language: 'en' | 'vi'
): Promise<string[]> => {
  const ai = getClient();
  
  const prompt = language === 'vi' 
    ? "Liệt kê các nguyên liệu thực phẩm nhìn thấy trong hình ảnh này. Trả về danh sách dưới dạng JSON array đơn giản chứa tên các nguyên liệu bằng tiếng Việt."
    : "Identify the food ingredients in this image. Return a simple JSON array of strings containing the ingredient names.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        },
        safetySettings: safetySettings,
      }
    });

    let jsonString = response.text;
    if (!jsonString) return [];

    // Sanitize potential markdown code blocks
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonString) as string[];

  } catch (error) {
    console.error("Error identifying ingredients:", error);
    throw new Error("Failed to analyze image.");
  }
};

// Function to generate recipes based on ingredients
export const generateRecipesFromIngredients = async (
  ingredients: string[],
  language: 'en' | 'vi'
): Promise<Recipe[]> => {
  const ai = getClient();

  const langContext = language === 'vi' 
    ? "Create 4 detailed Vietnamese or Asian-inspired recipes in Vietnamese language."
    : "Create 4 detailed creative recipes in English.";

  const prompt = `
    Act as a world-class chef. 
    ${langContext}
    Based on these ingredients: ${ingredients.join(", ")}.
    You may assume basic pantry staples (oil, salt, pepper, water, sugar) are available.
    
    Return a JSON array of exactly 4 recipe objects.
    Each recipe must have:
    - id (unique string)
    - name (creative title)
    - description (flavor/texture profile)
    - ingredients (full list with quantities)
    - instructions (array of steps with time and optional tips)
    - cookingTime (e.g. "30 mins")
    - difficulty (Easy, Medium, Hard)
    - cuisineType
    - calories (estimate number)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              instructions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.INTEGER },
                    instruction: { type: Type.STRING },
                    time: { type: Type.STRING, nullable: true },
                    tip: { type: Type.STRING, nullable: true }
                  },
                  required: ["stepNumber", "instruction"]
                }
              },
              cookingTime: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
              cuisineType: { type: Type.STRING },
              calories: { type: Type.INTEGER }
            },
            required: ["id", "name", "description", "ingredients", "instructions", "cookingTime", "difficulty", "cuisineType"]
          }
        },
        safetySettings: safetySettings,
      }
    });

    let text = response.text;
    if (!text) return [];
    
    // Sanitize
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text) as Recipe[];

  } catch (error) {
    console.error("Error generating recipes:", error);
    throw new Error("Failed to generate recipes.");
  }
};

// Function to generate a photorealistic image for a recipe
export const generateRecipeImage = async (
  recipeName: string,
  description: string
): Promise<string | null> => {
  const ai = getClient();
  // Keep prompt in English for better image generation results, regardless of UI language
  const prompt = `Professional food photography of ${recipeName}, ${description}. High resolution, 4k, appetizing, cinematic lighting, detailed texture, on a beautiful plate, restaurant quality.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3',
        // @ts-ignore - Safety settings might vary for image models, but passing generalized config if supported or relying on defaults.
        // Note: Imagen often has stricter built-in filters that can't always be overridden, hence the fallback below is crucial.
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("No image bytes returned from Imagen");
  } catch (error) {
    console.warn("Imagen generation failed (likely restricted environment), falling back to AI Placeholder:", error);
    
    // Fallback: Use Pollinations.ai to generate a relevant food image via URL
    // This ensures the user gets a relevant visual even if the Imagen API fails
    const safeName = encodeURIComponent(recipeName);
    const safeDesc = encodeURIComponent(description.substring(0, 80)); // Truncate for URL safety
    // We append a random seed to ensure unique caching behavior if needed, though mostly unique by name
    return `https://image.pollinations.ai/prompt/delicious%20food%20photography%20of%20${safeName}%20${safeDesc}?width=800&height=600&nologo=true&model=flux`;
  }
};