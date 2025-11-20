import React, { useState } from 'react';
import { Recipe, Language } from '../types';
import { DIFFICULTY_COLORS, TRANSLATIONS } from '../constants';

interface Props {
  recipe: Recipe;
  onClick: () => void;
  language: Language;
  index: number;
}

const RecipeCard: React.FC<Props> = ({ recipe, onClick, language, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const style = { animationDelay: `${index * 100}ms` };
  const t = TRANSLATIONS[language];

  // Fallback image logic
  const fallbackImage = `https://image.pollinations.ai/prompt/food%20dish%20${encodeURIComponent(recipe.name)}?width=400&height=300&nologo=true`;
  const displayImage = recipe.imageUrl || fallbackImage;

  return (
    <div 
      style={style}
      onClick={onClick}
      className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-2 cursor-pointer border border-gray-100 dark:border-gray-700 animate-slide-up"
    >
      {/* Image Header */}
      <div className="relative h-56 overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
        {/* Loading Skeleton */}
        <div className={`absolute inset-0 animate-pulse bg-gray-300 dark:bg-gray-600 z-10 transition-opacity duration-500 ${imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}></div>
        
        <img 
          src={displayImage} 
          alt={recipe.name}
          className={`w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/400x300?text=Delicious+Food";
            setImageLoaded(true);
          }}
        />
        
        {/* Gradient Overlay for hover aesthetic */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20">
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-black/60 backdrop-blur-md text-gray-800 dark:text-white rounded-full border border-white/20 shadow-sm">
            {recipe.cuisineType}
          </span>
        </div>

        <div className="absolute top-3 right-3 z-20">
          <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm backdrop-blur-md border border-white/10 ${DIFFICULTY_COLORS[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex flex-col flex-grow p-5">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {recipe.name}
            </h3>
        </div>

        {/* Meta Data Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="font-medium">{recipe.cookingTime}</span>
            </div>
            {recipe.calories && (
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span className="font-medium">{recipe.calories} kcal</span>
                </div>
            )}
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-5 flex-grow">
          {recipe.description}
        </p>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto flex items-center justify-between">
            <div className="flex items-center text-xs font-medium text-gray-400 dark:text-gray-500">
                 <span className="bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                    {recipe.ingredients.length} {t.ingredients}
                 </span>
            </div>
            
            <button className="group/btn flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 transition-all">
                View Recipe
                <div className="p-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all transform group-hover/btn:translate-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;