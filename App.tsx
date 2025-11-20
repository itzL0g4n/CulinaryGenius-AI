import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import IngredientInput from './components/IngredientInput';
import RecipeCard from './components/RecipeCard';
import RecipeModal from './components/RecipeModal';
import { ToastContainer } from './components/Toast';
import { Theme, Language, Ingredient, Recipe, ToastMessage } from './types';
import { TRANSLATIONS } from './constants';
import { generateRecipesFromIngredients, generateRecipeImage } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Advanced Loading State
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const progressIntervalRef = useRef<number | null>(null);
  const messageIntervalRef = useRef<number | null>(null);

  // Translations
  const t = TRANSLATIONS[language];

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Notifications
  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Ingredient Management
  const addIngredient = (name: string) => {
    const normalized = name.toLowerCase().trim();
    if (ingredients.some(ing => ing.name.toLowerCase() === normalized)) {
      notify('Ingredient already added', 'info');
      return;
    }
    setIngredients(prev => [...prev, { id: Date.now().toString() + Math.random(), name: name.trim() }]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  // Helper to cycle messages
  const cycleMessages = useCallback((phase: 'analyzing' | 'recipes' | 'images') => {
    const messages = t.loadingPhases[phase];
    let index = 0;
    
    setLoadingMessage(messages[0]);
    
    if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    
    messageIntervalRef.current = window.setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 2000);
  }, [t]);

  // Helper to animate progress bar smoothly
  const animateProgress = (targetStart: number, targetEnd: number, duration: number) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    const startTime = Date.now();
    const startValue = loadingProgress;
    
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      
      const current = startValue + (targetEnd - startValue) * easeOut;
      setLoadingProgress(current);
      
      if (progress >= 1) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
    }, 20);
  };

  // Cleanup intervals on unmount or when loading stops
  useEffect(() => {
    if (!loading) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      setLoadingProgress(0);
    }
  }, [loading]);

  // Handle image analysis loading from child component
  const setAnalysisLoading = (isLoading: boolean) => {
    setLoading(isLoading);
    if (isLoading) {
      setLoadingProgress(0);
      animateProgress(0, 90, 5000); // Slower animation for analysis
      cycleMessages('analyzing');
    } else {
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500);
    }
  };

  // Generate Recipes with Images
  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) {
      notify('Please add at least one ingredient', 'error');
      return;
    }
    
    setLoading(true);
    setRecipes([]); // Clear previous results immediately
    
    try {
      // Phase 1: Text Generation (0% -> 50%)
      setLoadingProgress(0);
      cycleMessages('recipes');
      animateProgress(0, 50, 3000); // Estimate 3s for text

      const ingredientNames = ingredients.map(i => i.name);
      
      const generatedRecipes = await generateRecipesFromIngredients(ingredientNames, language);
      
      if (generatedRecipes.length === 0) {
        notify('Could not generate recipes. Try different ingredients.', 'error');
        setLoading(false);
        return;
      }

      // Phase 2: Image Generation (50% -> 95%)
      // Cancel previous animation and start new one
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setLoadingProgress(50);
      cycleMessages('images');
      animateProgress(50, 95, 8000); // Estimate 8s for images

      // Parallel image generation
      const recipesWithImages = await Promise.all(
        generatedRecipes.map(async (recipe) => {
          try {
            const imageUrl = await generateRecipeImage(recipe.name, recipe.description);
            return { ...recipe, imageUrl: imageUrl || undefined };
          } catch (e) {
            console.error(`Failed to generate image for ${recipe.name}`, e);
            return recipe; // Return without image if fail
          }
        })
      );

      // Phase 3: Complete
      setLoadingProgress(100);
      // Small delay to let the user see the 100%
      setTimeout(() => {
        setRecipes(recipesWithImages);
        setLoading(false);
        notify('Recipes generated successfully!', 'success');
      }, 500);
      
    } catch (error) {
      console.error(error);
      notify('Error generating recipes. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full relative overflow-x-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Animated Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob dark:bg-indigo-600/20"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 dark:bg-purple-600/20"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 dark:bg-pink-600/20"></div>
      </div>

      <div className="max-w-6xl mx-auto pb-20">
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          language={language} 
          setLanguage={setLanguage} 
        />

        <main className="px-4 md:px-8 mt-8">
          {/* Input Section */}
          <div className="flex flex-col items-center justify-center mb-12 animate-slide-up">
             <IngredientInput 
                ingredients={ingredients}
                addIngredient={addIngredient}
                removeIngredient={removeIngredient}
                language={language}
                setLoading={setAnalysisLoading}
                notify={notify}
             />
             
             <button
                onClick={handleGenerateRecipes}
                disabled={ingredients.length === 0 || loading}
                className={`
                    relative px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 overflow-hidden
                    ${ingredients.length === 0 ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30'}
                `}
             >
                <span className="relative z-10 flex items-center">
                {loading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.generating}
                    </>
                ) : (
                    t.generate
                )}
                </span>
             </button>

             {/* Engaging Loading Bar */}
             {loading && (
                <div className="w-full max-w-md mt-8 flex flex-col items-center animate-fade-in">
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 shadow-inner relative">
                        {/* Shimmer Effect overlay */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_1.5s_infinite]"></div>
                        
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                    <p className="mt-4 text-lg font-medium text-indigo-600 dark:text-indigo-400 animate-pulse text-center min-h-[1.75rem]">
                        {loadingMessage}
                    </p>
                </div>
             )}
          </div>

          {/* Results Section */}
          {recipes.length > 0 && !loading && (
            <div className="animate-slide-up">
                <h2 className="text-2xl font-serif font-bold mb-6 text-gray-800 dark:text-white border-l-4 border-indigo-500 pl-4">
                    {t.recipesTitle}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {recipes.map((recipe, idx) => (
                        <RecipeCard 
                            key={recipe.id} 
                            recipe={recipe} 
                            onClick={() => setSelectedRecipe(recipe)}
                            language={language}
                            index={idx}
                        />
                    ))}
                </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {selectedRecipe && (
        <RecipeModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)}
            language={language}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Watermark */}
      <div className="fixed bottom-3 w-full text-center z-30 pointer-events-none select-none">
          <span className="inline-block text-[10px] md:text-xs font-medium text-gray-400 dark:text-gray-500 opacity-60 bg-white/50 dark:bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 shadow-sm">
            ©️ TomBocXiMang - 2025
          </span>
      </div>
    </div>
  );
};

export default App;