import React from 'react';
import { LayoutType } from '../types';

interface LayoutPreviewProps {
  layout: LayoutType;
  selected: boolean;
  onClick: () => void;
}

const LayoutPreview: React.FC<LayoutPreviewProps> = ({ layout, selected, onClick }) => {
  const getSVG = () => {
    // In dark mode, we want the wireframe to be visible.
    // activeClass determines the stroke color.
    // Adjusted inactive color to text-gray-400 for better visibility on dark bg
    const activeClass = selected ? "text-brand-500" : "text-gray-300 dark:text-gray-500";
    
    // Fill colors usually need to be subtle.
    
    switch (layout) {
      case LayoutType.LAYOUT_1: // Center 1 Big
        return (
          <svg viewBox="0 0 110 240" className={activeClass}>
            <rect x="0" y="0" width="110" height="240" fill="none" stroke="currentColor" strokeWidth="2"/>
            {/* Headlines */}
            <rect x="10" y="10" width="40" height="10" fill="currentColor" opacity="0.5"/>
            <rect x="60" y="10" width="40" height="10" fill="currentColor" opacity="0.5"/>
            {/* Dish */}
            <circle cx="55" cy="100" r="45" fill="currentColor" opacity="0.2"/>
            <circle cx="55" cy="100" r="40" fill="none" stroke="currentColor"/>
            {/* Bottom Text */}
            <rect x="10" y="180" width="40" height="40" fill="currentColor" opacity="0.3"/>
            {/* CTA */}
            <rect x="60" y="210" width="40" height="20" fill="currentColor"/>
          </svg>
        );
      case LayoutType.LAYOUT_2: // Right Side 1 Big
        return (
          <svg viewBox="0 0 110 240" className={activeClass}>
             <rect x="0" y="0" width="110" height="240" fill="none" stroke="currentColor" strokeWidth="2"/>
             {/* Left Text Col */}
             <rect x="5" y="10" width="25" height="20" fill="currentColor" opacity="0.5"/>
             <rect x="5" y="40" width="25" height="150" fill="currentColor" opacity="0.2"/>
             {/* Right Dish */}
             <circle cx="80" cy="120" r="60" fill="currentColor" opacity="0.2"/>
             {/* CTA */}
             <rect x="60" y="210" width="40" height="20" fill="currentColor"/>
          </svg>
        );
      case LayoutType.LAYOUT_3: // Two Dishes Symmetric
        return (
          <svg viewBox="0 0 110 240" className={activeClass}>
             <rect x="0" y="0" width="110" height="240" fill="none" stroke="currentColor" strokeWidth="2"/>
             {/* Headlines */}
             <rect x="10" y="10" width="40" height="10" fill="currentColor" opacity="0.5"/>
             <rect x="60" y="10" width="40" height="10" fill="currentColor" opacity="0.5"/>
             {/* Dish 1 */}
             <circle cx="30" cy="100" r="25" fill="currentColor" opacity="0.2"/>
             {/* Dish 2 */}
             <circle cx="80" cy="100" r="25" fill="currentColor" opacity="0.2"/>
             {/* Desc */}
             <rect x="10" y="140" width="40" height="20" fill="currentColor" opacity="0.3"/>
             <rect x="60" y="140" width="40" height="20" fill="currentColor" opacity="0.3"/>
             {/* CTA */}
             <rect x="60" y="210" width="40" height="20" fill="currentColor"/>
          </svg>
        );
      case LayoutType.LAYOUT_4: // 6 Dishes
        return (
          <svg viewBox="0 0 110 240" className={activeClass}>
             <rect x="0" y="0" width="110" height="240" fill="none" stroke="currentColor" strokeWidth="2"/>
             {/* Headline */}
             <rect x="10" y="10" width="90" height="10" fill="currentColor" opacity="0.5"/>
             {/* Matrix */}
             {[0,1,2].map(row => (
               <React.Fragment key={row}>
                 <circle cx="30" cy={50 + row*50} r="15" fill="currentColor" opacity="0.2"/>
                 <rect x="30" y={70 + row*50} width="20" height="5" fill="currentColor" opacity="0.4"/>

                 <circle cx="80" cy={50 + row*50} r="15" fill="currentColor" opacity="0.2"/>
                 <rect x="80" y={70 + row*50} width="20" height="5" fill="currentColor" opacity="0.4"/>
               </React.Fragment>
             ))}
             {/* CTA */}
             <rect x="60" y="210" width="40" height="20" fill="currentColor"/>
          </svg>
        );
    }
  };

  const containerClass = selected 
    ? "border-2 border-brand-500 bg-brand-50 dark:bg-brand-900/20 p-2 rounded-lg cursor-pointer transition-all shadow-md"
    : "border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 rounded-lg cursor-pointer hover:border-brand-300 dark:hover:border-brand-500 hover:shadow transition-all";

  return (
    <div className={containerClass} onClick={onClick}>
      <div className="w-16 h-32 mx-auto">
        {getSVG()}
      </div>
      <div className={`text-center text-xs mt-2 font-medium ${selected ? 'text-brand-700 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {layout.replace('layout_', 'Layout ')}
      </div>
    </div>
  );
};

export default LayoutPreview;