import React from 'react';
import { Recipe, Language } from '../types';
import { DIFFICULTY_COLORS, TRANSLATIONS } from '../constants';

interface Props {
  recipe: Recipe;
  onClick: () => void;
  language: Language;
  index: number;
}

const RecipeCard: React.FC<Props> = ({ recipe, onClick, language, index }) => {
  // Add a small delay to stagger animations
  const style = { animationDelay: `${index * 100}ms` };
  const t = TRANSLATIONS[language];

  // Fallback image if generation fails or is loading
  const displayImage = recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/400/300`;

  return (
    <div 
      style={style}
      onClick={onClick}
      className="glass-card group relative rounded-2xl overflow-hidden bg-white/60 dark:bg-gray-800/60 border border-white/20 cursor-pointer animate-slide-up"
    >
      <div className="h-48 overflow-hidden relative">
        <img 
          src={displayImage} 
          alt={recipe.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
        
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-full shadow-sm uppercase ${DIFFICULTY_COLORS[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 text-white">
            <span className="text-xs font-medium bg-black/30 px-2 py-1 rounded backdrop-blur-sm flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {recipe.cookingTime}
            </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-500 transition-colors">
          {recipe.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 h-10">
          {recipe.description}
        </p>
        
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                {recipe.cuisineType}
            </span>
             <span className="text-xs text-indigo-500 font-bold group-hover:translate-x-1 transition-transform flex items-center">
                View Recipe →
            </span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;