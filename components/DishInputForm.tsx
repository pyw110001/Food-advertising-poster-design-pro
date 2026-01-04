import React, { useState } from 'react';
import { DishInput, LayoutType } from '../types';
import { Sparkles, Utensils, Wand2, Loader2, Type } from 'lucide-react';
import { getDishSuggestions } from '../services/geminiService';

interface DishInputFormProps {
  layout: LayoutType;
  dishes: DishInput[];
  // Changed from onChange(index, field, value) to onUpdate(index, partialObject)
  onUpdate: (index: number, updates: Partial<DishInput>) => void;
}

const DishInputForm: React.FC<DishInputFormProps> = ({ layout, dishes, onUpdate }) => {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handleSmartSuggest = async (index: number) => {
    setLoadingIndex(index);
    const currentDish = dishes[index];
    try {
        const suggestion = await getDishSuggestions(currentDish.name);
        
        // Use bulk update to prevent state overwrites (Race Condition Fix)
        onUpdate(index, {
            ...(suggestion.name && { name: suggestion.name }),
            ...(suggestion.tag && { tag: suggestion.tag }),
            ...(suggestion.keywords && { keywords: suggestion.keywords }),
            ...(suggestion.slogan && { slogan: suggestion.slogan }),
        });

    } catch (e) {
        console.error(e);
        // Attempt to open key selection if that was the issue
        const win = window as any;
        if (win.aistudio) {
            try { await win.aistudio.openSelectKey(); } catch {}
        }
        alert("Failed to get suggestions. Please check your API Key settings.");
    } finally {
        setLoadingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      {dishes.map((dish, index) => (
        <div key={dish.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative group transition-colors">
            <div className="absolute -left-3 -top-3 bg-brand-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10">
                {index + 1}
            </div>
            
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                 <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Dish Configuration</h3>
                 <button 
                    onClick={() => handleSmartSuggest(index)}
                    disabled={loadingIndex === index}
                    className="flex items-center space-x-1 text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-2 py-1 rounded hover:bg-brand-100 dark:hover:bg-brand-900/40 transition disabled:opacity-50"
                 >
                    {loadingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    <span>AI Recommend (One-Click)</span>
                 </button>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Dish Name (菜名)</label>
              <div className="relative">
                <Utensils className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={dish.name}
                  onChange={(e) => onUpdate(index, { name: e.target.value })}
                  placeholder="e.g. 红烧肉 (Braised Pork)"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-sm placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Cuisine Tag (菜系)</label>
              <input
                type="text"
                value={dish.tag || ''}
                onChange={(e) => onUpdate(index, { tag: e.target.value })}
                placeholder="e.g. 本帮 (Shanghai Style)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-sm placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Keywords / Features (关键词)</label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-2.5 w-4 h-4 text-brand-400" />
                <input
                  type="text"
                  value={dish.keywords}
                  onChange={(e) => onUpdate(index, { keywords: e.target.value })}
                  placeholder="e.g. spicy, steam, crispy, glossy sauce"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-sm placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Slogan / Title Text (文案)</label>
              <div className="relative">
                <Type className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={dish.slogan || ''}
                  onChange={(e) => onUpdate(index, { slogan: e.target.value })}
                  placeholder="e.g. 匠心独运 鲜香四溢 (Rendered on poster)"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-sm placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>
            
            {dish.translatedPrompt && (
               <div className="col-span-2 mt-1">
                   <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-gray-50 dark:bg-gray-700/50 p-1 rounded">
                       AI Translated: {dish.translatedPrompt}
                   </p>
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DishInputForm;