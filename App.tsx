import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import IngredientInput from './components/IngredientInput';
import RecipeCard from './components/RecipeCard';
import RecipeModal from './components/RecipeModal';
import { ToastContainer } from './components/Toast.tsx';
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
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Loading Logic
  const startLoadingSequence = () => {
    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage(t.generating);
    
    // Message cycling
    let msgIndex = 0;
    const messages = t.loadingMessages || ['Cooking...'];
    
    // Fake progress bar
    progressIntervalRef.current = setInterval(() => {
      setLoadingProgress(prev => {
        // Slow down as it gets closer to 90%
        const increment = prev < 60 ? 5 : prev < 80 ? 2 : 0.5;
        const next = prev + increment;
        
        // Cycle messages based on progress approximate
        if (prev > 20 && prev < 25) setLoadingMessage(messages[0]);
        if (prev > 40 && prev < 45) setLoadingMessage(messages[1]);
        if (prev > 60 && prev < 65) setLoadingMessage(messages[2]);
        if (prev > 80 && prev < 85) setLoadingMessage(messages[3]);
        
        return next >= 90 ? 90 : next;
      });
    }, 300);
  };

  const stopLoadingSequence = () => {
    setLoadingProgress(100);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setTimeout(() => {
      setLoading(false);
      setLoadingProgress(0);
    }, 500);
  };

  // Generate Recipes with Images
  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) {
      notify('Please add at least one ingredient', 'error');
      return;
    }
    
    startLoadingSequence();
    setRecipes([]); // Clear previous
    
    try {
      const ingredientNames = ingredients.map(i => i.name);
      
      // Step 1: Generate Text Recipes
      const generatedRecipes = await generateRecipesFromIngredients(ingredientNames, language);
      
      if (generatedRecipes.length === 0) {
        notify('Could not generate recipes. Try different ingredients.', 'error');
        stopLoadingSequence();
        return;
      }

      // IMPORTANT: Do not set recipes yet. Wait for images to be ready.
      
      // Update loading for image phase
      setLoadingMessage(t.generatingImages);
      setLoadingProgress(85); // Update progress to reflect image generation phase
      
      // Step 2: Generate Images in Parallel
      const recipesWithImages = await Promise.all(
        generatedRecipes.map(async (recipe) => {
          try {
            const imageUrl = await generateRecipeImage(recipe.name, recipe.description);
            return { ...recipe, imageUrl: imageUrl || undefined };
          } catch (e) {
            return recipe; // Return without image if fail
          }
        })
      );

      // Step 3: Display everything at once
      setRecipes(recipesWithImages);
      notify('Recipes generated successfully!', 'success');
      
    } catch (error) {
      console.error(error);
      notify('Error generating recipes. Please try again.', 'error');
    } finally {
      stopLoadingSequence();
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
                setLoading={setLoading}
                notify={notify}
             />
             
             <button
                onClick={handleGenerateRecipes}
                disabled={ingredients.length === 0 || loading}
                className={`
                    relative px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105
                    ${ingredients.length === 0 ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30'}
                `}
             >
                {loading ? (
                    <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.generating}
                    </span>
                ) : (
                    t.generate
                )}
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
                    <p className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
                        {loadingMessage}
                    </p>
                </div>
             )}
          </div>

          {/* Results Section */}
          {recipes.length > 0 && (
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