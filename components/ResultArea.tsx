import React from 'react';
import { AppMode, GeneratedItem } from '../types';
import { Copy, Download, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface ResultAreaProps {
  mode: AppMode;
  items: GeneratedItem[];
  onDelete: (id: string) => void;
  onRegenerate: (item: GeneratedItem) => void;
}

const ResultArea: React.FC<ResultAreaProps> = ({ mode, items, onDelete, onRegenerate }) => {
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadImage = (item: GeneratedItem) => {
    if (item.imageUrl) {
        const link = document.createElement('a');
        link.href = item.imageUrl;
        link.download = `hefenglou_${item.layout}_${item.id.slice(0, 4)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-center font-medium">No results yet.</p>
        <p className="text-sm text-center">Configure settings and click Generate.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto h-full pr-2">
      {items.map((item) => (
        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
             <span className="font-semibold uppercase tracking-wider">{item.layout.replace('_', ' ')} • {item.styleName}</span>
             <div className="flex space-x-2">
                <button onClick={() => onDelete(item.id)} className="hover:text-red-500 dark:hover:text-red-400">Del</button>
             </div>
          </div>

          <div className="p-4">
            {/* Nano Banana Image Mode */}
            {mode === AppMode.NANO_BANANA && (
                <div className="mb-4">
                    {item.status === 'pending' && (
                        <div className="aspect-[11/24] w-full bg-gray-100 dark:bg-gray-700 animate-pulse rounded flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-gray-300 dark:text-gray-500 animate-spin" />
                        </div>
                    )}
                    {item.status === 'failed' && (
                        <div className="aspect-[11/24] w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded flex flex-col items-center justify-center text-red-400 dark:text-red-300">
                             <AlertCircle className="w-8 h-8 mb-2" />
                             <span className="text-xs">Generation Failed</span>
                             <button onClick={() => onRegenerate(item)} className="mt-2 text-xs underline">Retry</button>
                        </div>
                    )}
                    {item.status === 'success' && item.imageUrl && (
                        <div className="relative group">
                            <img src={item.imageUrl} alt="Generated Poster" className="w-full rounded shadow-sm bg-gray-100 dark:bg-gray-700" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 space-x-3">
                                <button 
                                    onClick={() => handleDownloadImage(item)}
                                    className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:scale-110 transition"
                                    title="Download Image"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => window.open(item.imageUrl, '_blank')}
                                    className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:scale-110 transition"
                                    title="View Full Size"
                                >
                                    <Sparkles className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Prompt Text (Visible in both modes) */}
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs font-mono text-gray-600 dark:text-gray-300 break-words max-h-32 overflow-y-auto border border-gray-100 dark:border-gray-700">
                {item.fullPrompt}
            </div>

            {/* Actions */}
            <div className="mt-3 flex space-x-2">
                <button 
                    onClick={() => handleCopy(item.fullPrompt)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs transition"
                >
                    <Copy className="w-3 h-3" />
                    <span>Copy Prompt</span>
                </button>
                {mode === AppMode.MIDJOURNEY && (
                    <button 
                        onClick={() => onRegenerate(item)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded text-xs transition"
                    >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                    </button>
                )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultArea;