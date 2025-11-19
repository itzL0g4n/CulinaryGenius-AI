export interface Ingredient {
  id: string;
  name: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  time?: string;
  tip?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: RecipeStep[];
  cookingTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisineType: string;
  calories?: number;
  imageUrl?: string;
}

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'vi';

export interface AppState {
  ingredients: Ingredient[];
  recipes: Recipe[];
  loading: boolean;
  analyzingImage: boolean;
  error: string | null;
  language: Language;
  theme: Theme;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}