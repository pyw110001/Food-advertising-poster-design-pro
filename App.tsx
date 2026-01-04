import React, { useState, useEffect, useRef } from 'react';
import { 
  AppMode, 
  LayoutType, 
  DishInput, 
  GeneratedItem, 
  GenerationConfig 
} from './types';
import { STYLE_OPTIONS } from './constants';
import { buildPrompt } from './services/promptService';
import { generatePosterImage, translateDishToEnglish, editPosterImage } from './services/geminiService';
import LayoutPreview from './components/LayoutPreview';
import DishInputForm from './components/DishInputForm';
import ImageEditForm from './components/ImageEditForm';
import ResultArea from './components/ResultArea';
import { Settings, Archive, Palette, ChefHat, Image as ImageIcon, Zap, AlertTriangle, RefreshCw, Moon, Sun, Key, PenTool, Upload, X } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const DEFAULT_DISH: DishInput = { id: '1', name: '', keywords: '', slogan: '' };

export default function App() {
  // --- State ---
  const [mode, setMode] = useState<AppMode>(AppMode.MIDJOURNEY);
  const [layout, setLayout] = useState<LayoutType>(LayoutType.LAYOUT_1);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(STYLE_OPTIONS[0].id);
  const [customStyle, setCustomStyle] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Dynamic Inputs
  const [dishes, setDishes] = useState<DishInput[]>([DEFAULT_DISH]);

  // Image Edit Inputs
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState<string>('');
  const [sourceRatio, setSourceRatio] = useState<string>('1:1');
  
  // New: Reference Image for Generation
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Results
  const [results, setResults] = useState<GeneratedItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<GenerationConfig>({
    resolution: 'hd', // Default to HD for Pro model quality
    variations: 1,
    negativeSafety: true
  });
  
  // API Key Check
  const [hasApiKey, setHasApiKey] = useState(false);

  // --- Effects ---

  // Check API Key on mount and periodic check
  useEffect(() => {
    const checkKey = async () => {
      // Cast to any to avoid type conflict with global definitions
      const win = window as any;
      if (win.aistudio) {
        try {
          const selected = await win.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } catch (e) {
          // Fallback if method fails
          setHasApiKey(!!process.env.API_KEY);
        }
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  // Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Adjust dish inputs when layout changes
  useEffect(() => {
    let requiredCount = 1;
    if (layout === LayoutType.LAYOUT_3) requiredCount = 2;
    if (layout === LayoutType.LAYOUT_4) requiredCount = 6;

    setDishes(prev => {
      if (prev.length === requiredCount) return prev;
      if (prev.length > requiredCount) return prev.slice(0, requiredCount);
      const newDishes = [...prev];
      while (newDishes.length < requiredCount) {
        newDishes.push({ id: Math.random().toString(36).substr(2, 9), name: '', keywords: '', slogan: '' });
      }
      return newDishes;
    });
  }, [layout]);

  // Local Storage (Simplified)
  useEffect(() => {
    const saved = localStorage.getItem('hefenglou_results');
    if (saved) {
      try {
        setResults(JSON.parse(saved));
      } catch (e) { console.error("Failed to load history"); }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('hefenglou_results', JSON.stringify(results));
    } catch (e) {
      // CRITICAL FIX: Catch quota exceeded errors to prevent white-screen crash
      // Images (especially HD ones) are too large for localStorage (5MB limit)
      console.warn("LocalStorage quota exceeded or unavailable. History not saved.", e);
    }
  }, [results]);


  // --- Handlers ---

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio) {
      try {
        await win.aistudio.openSelectKey();
        // Assume success to mitigate race condition per instructions
        setHasApiKey(true);
      } catch (e) {
        console.error("Error selecting key", e);
      }
    } else {
      alert("API Key selection not available in this environment. Please set process.env.API_KEY manually.");
    }
  };

  // Improved handler: Accepts Partial<DishInput> to allow updating multiple fields at once
  const handleDishUpdate = (index: number, updates: Partial<DishInput>) => {
    setDishes(prev => {
      const newDishes = [...prev];
      newDishes[index] = { ...newDishes[index], ...updates };
      return newDishes;
    });
  };

  const getStylePrompt = () => {
    const preset = STYLE_OPTIONS.find(s => s.id === selectedStyleId);
    return customStyle.trim() ? customStyle : (preset?.promptSegment || '');
  };

  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setReferenceImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleGenerate = async () => {
    // If Nano Banana mode or Image Edit mode, check API Key first
    if ((mode === AppMode.NANO_BANANA || mode === AppMode.IMAGE_EDIT) && !hasApiKey) {
        await handleSelectKey();
        return; 
    }

    setIsGenerating(true);
    const newItemId = Math.random().toString(36).substr(2, 9);
    
    // IMAGE EDIT FLOW
    if (mode === AppMode.IMAGE_EDIT) {
      if (!sourceImage || !editInstruction) {
        setIsGenerating(false);
        alert("Please upload an image and provide instructions.");
        return;
      }

      const newItem: GeneratedItem = {
        id: newItemId,
        timestamp: Date.now(),
        mode,
        layout: LayoutType.LAYOUT_1, // Default for edit
        styleName: 'Image Edit',
        fullPrompt: editInstruction,
        dishes: [],
        status: 'pending'
      };

      setResults(prev => [newItem, ...prev]);

      try {
        const base64Image = await editPosterImage(sourceImage, editInstruction, sourceRatio);
        setResults(prev => prev.map(item => 
          item.id === newItemId 
          ? { ...item, status: base64Image ? 'success' : 'failed', imageUrl: base64Image || undefined } 
          : item
        ));
      } catch (e: any) {
        console.error("Edit Error", e);
        const errorMsg = e.message || e.toString() || JSON.stringify(e);
        if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
           setHasApiKey(false);
           alert("Permission denied. Please select a valid API Key.");
        }
        setResults(prev => prev.map(item => item.id === newItemId ? { ...item, status: 'failed' } : item));
      }

    } 
    // MIDJOURNEY & NANO BANANA FLOW
    else {
      // 1. Translate Dishes first (if name is Chinese or raw)
      const translatedDishes = await Promise.all(dishes.map(async (d) => {
        if (!d.name) return d;
        const translated = await translateDishToEnglish(d.name, d.keywords);
        return { ...d, translatedPrompt: translated };
      }));

      setDishes(translatedDishes);

      const stylePrompt = getStylePrompt();
      const prompt = buildPrompt(mode, layout, stylePrompt, translatedDishes);
      const styleName = customStyle ? 'Custom' : STYLE_OPTIONS.find(s => s.id === selectedStyleId)?.name || 'Unknown';

      const newItem: GeneratedItem = {
        id: newItemId,
        timestamp: Date.now(),
        mode,
        layout,
        styleName,
        fullPrompt: prompt,
        dishes: translatedDishes,
        status: mode === AppMode.NANO_BANANA ? 'pending' : 'success'
      };

      setResults(prev => [newItem, ...prev]);

      if (mode === AppMode.NANO_BANANA) {
        try {
          // Added referenceImage parameter here
          const base64Image = await generatePosterImage(prompt, config.resolution, referenceImage);
          if (base64Image) {
             setResults(prev => prev.map(item => 
               item.id === newItemId ? { ...item, status: 'success', imageUrl: base64Image } : item
             ));
          } else {
             setResults(prev => prev.map(item => item.id === newItemId ? { ...item, status: 'failed' } : item));
          }
        } catch (e: any) {
          console.error("Gen Error", e);
          const errorMsg = e.message || e.toString() || JSON.stringify(e);
          if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
             setHasApiKey(false);
             alert("Permission denied. Please select a valid API Key with access to the model.");
          }
          setResults(prev => prev.map(item => item.id === newItemId ? { ...item, status: 'failed' } : item));
        }
      }
    }

    setIsGenerating(false);
  };

  const handleDelete = (id: string) => {
    setResults(prev => prev.filter(i => i.id !== id));
  };

  const handleRegenerate = async (item: GeneratedItem) => {
     if ((mode === AppMode.NANO_BANANA || mode === AppMode.IMAGE_EDIT) && !hasApiKey) {
        await handleSelectKey();
        return;
     }

     setIsGenerating(true);
     const prompt = item.fullPrompt; 
     
     // Handle Nano Banana / Image Edit regeneration
     if (item.mode === AppMode.NANO_BANANA || item.mode === AppMode.IMAGE_EDIT) {
         setResults(prev => prev.map(res => res.id === item.id ? { ...res, status: 'pending', imageUrl: undefined } : res));
         try {
             let base64Image: string | null = null;
             
             if (item.mode === AppMode.IMAGE_EDIT && sourceImage) {
                base64Image = await editPosterImage(sourceImage, prompt, sourceRatio);
             } else {
                // Pass reference image here as well if available
                base64Image = await generatePosterImage(prompt, config.resolution, referenceImage);
             }

             setResults(prev => prev.map(res => 
                 res.id === item.id 
                 ? { ...res, status: base64Image ? 'success' : 'failed', imageUrl: base64Image || undefined } 
                 : res
             ));
         } catch (e) {
             setResults(prev => prev.map(res => res.id === item.id ? { ...res, status: 'failed' } : res));
         }
     }
     setIsGenerating(false);
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("hefenglou_posters");
    
    results.forEach((item, index) => {
        const prefix = `poster_${index + 1}_${item.layout}`;
        folder?.file(`${prefix}_prompt.txt`, item.fullPrompt);
        if (item.imageUrl) {
            // Remove data:image/png;base64, header
            const data = item.imageUrl.split(',')[1];
            folder?.file(`${prefix}.png`, data, { base64: true });
        }
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "hefenglou_export.zip");
  };

  // --- Render ---

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900 font-sans transition-colors duration-200">
      
      {/* LEFT SIDEBAR: Config */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-10 shadow-lg transition-colors">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center">
              <span className="text-brand-500 mr-2">✦</span> 菜单海报生成器
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Elevator Poster System v1.0</p>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="text-gray-400 hover:text-brand-500 transition-colors dark:text-gray-500 dark:hover:text-brand-400"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
            {/* Mode Switch */}
            <section>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 block">Operation Mode</label>
                <div className="flex flex-col space-y-2">
                    {/* Row 1: Generate Modes */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <button 
                            className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center space-x-2 transition ${mode === AppMode.MIDJOURNEY ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            onClick={() => setMode(AppMode.MIDJOURNEY)}
                        >
                            <Settings className="w-3 h-3" />
                            <span>Midjourney</span>
                        </button>
                        <button 
                            className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center space-x-2 transition ${mode === AppMode.NANO_BANANA ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            onClick={() => setMode(AppMode.NANO_BANANA)}
                        >
                            <Zap className="w-3 h-3" />
                            <span>Generate</span>
                        </button>
                    </div>
                    {/* Row 2: Edit Mode */}
                     <button 
                        className={`w-full py-2 text-xs font-medium rounded-lg flex items-center justify-center space-x-2 transition border ${mode === AppMode.IMAGE_EDIT ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                        onClick={() => setMode(AppMode.IMAGE_EDIT)}
                    >
                        <PenTool className="w-3 h-3" />
                        <span>Edit Image</span>
                    </button>
                </div>
                
                {(mode === AppMode.NANO_BANANA || mode === AppMode.IMAGE_EDIT) && (
                    <div className="mt-4">
                        {!hasApiKey ? (
                            <button 
                                onClick={handleSelectKey}
                                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-xs flex items-center justify-center space-x-2 transition"
                            >
                                <Key className="w-3 h-3" />
                                <span>Select Paid API Key (Required)</span>
                            </button>
                        ) : (
                             <button 
                                onClick={handleSelectKey}
                                className="w-full py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded text-[10px] flex items-center justify-center space-x-1 transition"
                            >
                                <Key className="w-3 h-3" />
                                <span>API Key Active (Change)</span>
                            </button>
                        )}
                         <p className="mt-2 text-[10px] text-gray-400 leading-tight">
                            * Gemini 3 Pro model requires a specific paid project API key.
                            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline ml-1 hover:text-gray-600">Billing Docs</a>
                        </p>
                    </div>
                )}
            </section>

            {/* Layout Selector - Hide in Edit Mode */}
            {mode !== AppMode.IMAGE_EDIT && (
            <section>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 block">Layout Structure</label>
                <div className="grid grid-cols-2 gap-3">
                    {[LayoutType.LAYOUT_1, LayoutType.LAYOUT_2, LayoutType.LAYOUT_3, LayoutType.LAYOUT_4].map(l => (
                        <LayoutPreview 
                            key={l} 
                            layout={l} 
                            selected={layout === l} 
                            onClick={() => setLayout(l)} 
                        />
                    ))}
                </div>
            </section>
            )}

            {/* Style Selector - Hide in Edit Mode */}
            {mode !== AppMode.IMAGE_EDIT && (
            <section>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 block">Visual Style</label>
                <div className="space-y-2">
                    {STYLE_OPTIONS.map(style => (
                        <button
                            key={style.id}
                            onClick={() => { setSelectedStyleId(style.id); setCustomStyle(''); }}
                            className={`w-full text-left px-3 py-2 text-xs rounded transition flex items-center ${selectedStyleId === style.id && !customStyle ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-transparent'}`}
                        >
                            <Palette className="w-3 h-3 mr-2 opacity-70" />
                            {style.name}
                        </button>
                    ))}
                    <div className="mt-2">
                        <input 
                            type="text" 
                            placeholder="Custom style description..." 
                            value={customStyle}
                            onChange={(e) => setCustomStyle(e.target.value)}
                            className="w-full text-xs p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded focus:border-brand-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                    
                    {/* Reference Image Upload (Visible in Nano Banana Mode) */}
                    {mode === AppMode.NANO_BANANA && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-600">
                             <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block flex items-center justify-between">
                                 <span>Ref Image (Style)</span>
                                 {referenceImage && (
                                     <button onClick={() => setReferenceImage(null)} className="text-red-500 hover:text-red-700">
                                         <X className="w-3 h-3" />
                                     </button>
                                 )}
                             </label>
                             {!referenceImage ? (
                                 <button 
                                    onClick={() => referenceInputRef.current?.click()}
                                    className="w-full py-3 bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center justify-center space-x-1"
                                 >
                                     <Upload className="w-3 h-3" />
                                     <span>Upload Reference</span>
                                 </button>
                             ) : (
                                 <div className="relative group">
                                     <img src={referenceImage} alt="Ref" className="w-full h-24 object-cover rounded border border-gray-200 dark:border-gray-600" />
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                         <button 
                                            onClick={() => referenceInputRef.current?.click()}
                                            className="text-white text-xs underline"
                                         >Change</button>
                                     </div>
                                 </div>
                             )}
                             <input 
                                ref={referenceInputRef}
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleReferenceImageUpload} 
                             />
                        </div>
                    )}
                </div>
            </section>
            )}
            
            {/* Nano Config */}
            {mode === AppMode.NANO_BANANA && (
                <section className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 block">Render Config</label>
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Resolution</span>
                        <select 
                            value={config.resolution}
                            onChange={(e) => setConfig({...config, resolution: e.target.value as 'standard' | 'hd'})}
                            className="bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded p-1 outline-none focus:border-brand-500"
                        >
                            <option value="standard">Standard (1K)</option>
                            <option value="hd">Pro HD (2K)</option>
                        </select>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2">
                        * Using Gemini 3 Pro model for high fidelity text rendering.
                    </div>
                </section>
            )}
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 transition-colors">
             <button 
                onClick={handleExportZip}
                disabled={results.length === 0}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition"
             >
                 <Archive className="w-4 h-4" />
                 <span>Export All (ZIP)</span>
             </button>
        </div>
      </div>

      {/* MIDDLE: Input Form */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900 p-8 min-w-[400px] transition-colors">
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {mode === AppMode.IMAGE_EDIT ? 'Image Modification' : 'Dish Input'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {mode === AppMode.IMAGE_EDIT 
                            ? 'Upload an image and describe how to modify it (text, content, etc).' 
                            : `Configure ${layout === LayoutType.LAYOUT_4 ? '6 dishes' : (layout === LayoutType.LAYOUT_3 ? '2 dishes' : '1 dish')} for generation.`}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400 shadow-sm transition-colors">
                    {results.length} items generated
                </div>
            </div>

            {mode === AppMode.IMAGE_EDIT ? (
                <ImageEditForm 
                    sourceImage={sourceImage}
                    instruction={editInstruction}
                    onImageChange={(img, ratio) => { setSourceImage(img); setSourceRatio(ratio); }}
                    onInstructionChange={setEditInstruction}
                />
            ) : (
                <DishInputForm layout={layout} dishes={dishes} onUpdate={handleDishUpdate} />
            )}

            <div className="mt-8">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || (mode !== AppMode.IMAGE_EDIT && mode === AppMode.NANO_BANANA && !hasApiKey && !dishes.some(d => !d.name))}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed ${mode === AppMode.NANO_BANANA || mode === AppMode.IMAGE_EDIT ? 'bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700' : 'bg-gray-900 dark:bg-brand-600 dark:hover:bg-brand-500'}`}
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw className="w-6 h-6 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            {mode === AppMode.NANO_BANANA || mode === AppMode.IMAGE_EDIT ? <ImageIcon className="w-6 h-6" /> : <ChefHat className="w-6 h-6" />}
                            <span>
                                {(mode === AppMode.NANO_BANANA || mode === AppMode.IMAGE_EDIT) && !hasApiKey 
                                    ? 'Select API Key to Generate' 
                                    : `Generate ${mode === AppMode.MIDJOURNEY ? 'Prompts' : (mode === AppMode.IMAGE_EDIT ? 'Modifications' : 'Poster')}`
                                }
                            </span>
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* RIGHT: Results */}
      <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col z-10 shadow-lg transition-colors">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-bold text-gray-800 dark:text-white">Results</h2>
              {results.length > 0 && (
                  <button onClick={() => setResults([])} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300">Clear All</button>
              )}
          </div>
          <div className="flex-1 p-4 overflow-hidden">
              <ResultArea 
                mode={mode} 
                items={results} 
                onDelete={handleDelete}
                onRegenerate={handleRegenerate}
              />
          </div>
      </div>

    </div>
  );
}