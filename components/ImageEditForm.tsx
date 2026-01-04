import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ImageEditFormProps {
  sourceImage: string | null;
  instruction: string;
  onImageChange: (base64: string | null, aspectRatio: string) => void;
  onInstructionChange: (text: string) => void;
}

const ImageEditForm: React.FC<ImageEditFormProps> = ({ 
  sourceImage, 
  instruction, 
  onImageChange, 
  onInstructionChange 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [detectedRatio, setDetectedRatio] = useState<string>('1:1');

  const getClosestAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    const supported = [
      { str: "1:1", val: 1 },
      { str: "3:4", val: 3/4 },
      { str: "4:3", val: 4/3 },
      { str: "9:16", val: 9/16 },
      { str: "16:9", val: 16/9 },
    ];
    return supported.reduce((prev, curr) => 
      Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
    ).str;
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Load image to detect aspect ratio
        const img = new Image();
        img.onload = () => {
          const ratioStr = getClosestAspectRatio(img.width, img.height);
          setDetectedRatio(ratioStr);
          onImageChange(result, ratioStr);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div 
        className={`relative border-2 border-dashed rounded-xl transition-all ${
          dragActive 
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 bg-white dark:bg-gray-800'
        } ${sourceImage ? 'h-auto p-4' : 'h-64 flex flex-col items-center justify-center'}`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={handleDrop}
      >
        {!sourceImage ? (
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Upload Source Image</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">Drag & drop or click to browse</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition"
            >
              Select Image
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
               <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                 {detectedRatio} Aspect Ratio
               </span>
               <button 
                onClick={() => onImageChange(null, '1:1')}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="flex justify-center bg-gray-100 dark:bg-gray-900/50 rounded-lg p-2">
                <img src={sourceImage} alt="Source" className="max-h-[400px] object-contain rounded shadow-sm" />
            </div>
          </div>
        )}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleChange} 
        />
      </div>

      {/* Instruction Input */}
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-brand-500" />
            Modification Instructions
        </label>
        <textarea
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="Describe how to modify the image (e.g. 'Change the text to Summer Sale', 'Add steam to the dish', 'Make the background darker')"
          className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500 text-sm"
        />
      </div>
    </div>
  );
};

export default ImageEditForm;