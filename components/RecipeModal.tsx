import React from 'react';
import { Recipe, Language } from '../types';
import { TRANSLATIONS, DIFFICULTY_COLORS } from '../constants';

interface Props {
  recipe: Recipe;
  onClose: () => void;
  language: Language;
}

const RecipeModal: React.FC<Props> = ({ recipe, onClose, language }) => {
  const t = TRANSLATIONS[language];

  // Use generated image or fallback
  const imageUrl = recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/800/400`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl no-scrollbar animate-slide-up border border-white/20">
        {/* Header Image */}
        <div className="relative h-64 md:h-80 w-full">
            <img 
                src={imageUrl} 
                alt={recipe.name} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-wrap gap-2 mb-3">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${DIFFICULTY_COLORS[recipe.difficulty]}`}>
                        {recipe.difficulty}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {recipe.cuisineType}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        {recipe.cookingTime}
                    </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2 leading-tight">
                    {recipe.name}
                </h2>
                <p className="text-gray-200 text-lg">{recipe.description}</p>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 p-8">
            {/* Left Column: Ingredients */}
            <div className="w-full md:w-1/3 space-y-6">
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        {t.ingredients}
                    </h3>
                    <ul className="space-y-3">
                        {recipe.ingredients.map((ing, idx) => (
                            <li key={idx} className="flex items-start text-gray-600 dark:text-gray-300">
                                <span className="w-2 h-2 mt-2 mr-3 bg-green-400 rounded-full flex-shrink-0"></span>
                                <span>{ing}</span>
                            </li>
                        ))}
                    </ul>
                    {recipe.calories && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                            Estimated Calories: <span className="font-semibold text-gray-700 dark:text-gray-200">{recipe.calories} kcal</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Instructions */}
            <div className="w-full md:w-2/3">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    {t.instructions}
                </h3>
                <div className="space-y-8">
                    {recipe.instructions.map((step, idx) => (
                        <div key={idx} className="relative pl-8 border-l-2 border-indigo-100 dark:border-gray-700 hover:border-indigo-300 transition-colors">
                            <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs ring-4 ring-white dark:ring-gray-900">
                            </span>
                            <h4 className="text-sm font-bold text-indigo-500 uppercase mb-1">
                                {t.step} {step.stepNumber} {step.time && `• ${step.time}`}
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                                {step.instruction}
                            </p>
                            {step.tip && (
                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800/30 flex items-start gap-3">
                                    <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200 italic">
                                        <span className="font-bold">{t.tip}:</span> {step.tip}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;