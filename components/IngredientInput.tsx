import React, { useState, useRef } from 'react';
import { Ingredient, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { identifyIngredientsFromImage } from '../services/geminiService';

interface Props {
  ingredients: Ingredient[];
  addIngredient: (name: string) => void;
  removeIngredient: (id: string) => void;
  language: Language;
  setLoading: (loading: boolean) => void;
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const IngredientInput: React.FC<Props> = ({ 
  ingredients, 
  addIngredient, 
  removeIngredient, 
  language, 
  setLoading,
  notify
}) => {
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addIngredient(inputValue.trim());
      setInputValue('');
    }
  };

  // Helper to compress/resize image before sending to API
  const compressImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize to max 1024px to reduce payload size significantly
          // This fixes timeouts and payload limits on Vercel
          const MAX_SIZE = 1024;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
             reject(new Error("Could not get canvas context"));
             return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          // Remove the "data:image/jpeg;base64," prefix
          const base64 = dataUrl.split(',')[1];
          resolve({ base64, mimeType: 'image/jpeg' });
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic initial size check (allow up to 10MB source, we compress anyway)
    if (file.size > 10 * 1024 * 1024) {
        notify('Image too large (max 10MB)', 'error');
        return;
    }

    setLoading(true);
    notify(t.analyzing, 'info');

    try {
        // Compress image before sending
        const { base64, mimeType } = await compressImage(file);

        const detectedIngredients = await identifyIngredientsFromImage(base64, mimeType, language);
        
        if (detectedIngredients.length > 0) {
            detectedIngredients.forEach(name => addIngredient(name));
            notify(`Found ${detectedIngredients.length} ingredients!`, 'success');
        } else {
            notify('No ingredients detected.', 'info');
        }
    } catch (error) {
        console.error("Analysis failed:", error);
        notify('Failed to analyze image. Please try again.', 'error');
    } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.addIngredient}
            className="w-full px-6 py-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-gray-700/30 backdrop-blur-md shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-white transition-all placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button 
            onClick={() => {
                if(inputValue.trim()) {
                    addIngredient(inputValue.trim());
                    setInputValue('');
                }
            }}
            className="absolute right-3 top-3 p-1.5 rounded-full bg-indigo-500 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
            disabled={!inputValue.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div className="flex-shrink-0">
            <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                capture="environment"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full md:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                {t.analyzeImage}
            </button>
        </div>
      </div>

      {/* Ingredient Tags */}
      <div className="flex flex-wrap gap-2 min-h-[60px] p-4 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/10">
        {ingredients.length === 0 && (
            <span className="text-gray-500 dark:text-gray-400 italic self-center">{t.noIngredients}</span>
        )}
        {ingredients.map((ing) => (
          <span
            key={ing.id}
            className="group flex items-center px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-700 animate-fade-in"
          >
            {ing.name}
            <button
              onClick={() => removeIngredient(ing.id)}
              className="ml-2 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default IngredientInput;