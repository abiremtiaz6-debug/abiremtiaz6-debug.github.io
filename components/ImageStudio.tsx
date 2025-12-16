import React, { useState, useRef } from 'react';
import { NiktoService } from '../services/geminiService';
import { ImageGenOptions } from '../types';

const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ImageGenOptions>({ aspectRatio: "1:1", size: "1K" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      if (mode === 'generate') {
        const img = await NiktoService.generateImage(prompt, options);
        setResultImage(img);
      } else {
        if (!selectedFile) {
            alert("Please select an image to edit.");
            setLoading(false);
            return;
        }
        // Convert file to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            const img = await NiktoService.editImage(base64, prompt);
            setResultImage(img);
            setLoading(false);
        };
        reader.readAsDataURL(selectedFile);
        return; // Early return as reader is async
      }
    } catch (e) {
      console.error(e);
      alert("Image operation failed.");
    }
    setLoading(false);
  };

  const downloadImage = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `nikto-gen-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-nikto-primary to-white">
        <i className="fas fa-palette mr-3 text-nikto-primary"></i>Nikto Image Studio
      </h2>

      <div className="bg-nikto-surface p-6 rounded-xl border border-gray-700 shadow-xl mb-8">
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setMode('generate')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${mode === 'generate' ? 'bg-nikto-primary text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
          >
            Generate (Pro)
          </button>
          <button 
            onClick={() => setMode('edit')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${mode === 'edit' ? 'bg-white text-nikto-dark shadow-lg' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
          >
            Edit (Nano Banana)
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
             <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'generate' ? "Describe the image to generate..." : "Describe changes (e.g., 'Add a retro filter')"}
                className="flex-1 bg-slate-900 border border-gray-600 rounded-lg p-4 text-white focus:ring-2 focus:ring-nikto-primary outline-none"
             />
             <button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 min-w-[140px] shadow-lg"
             >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-magic mr-2"></i> Run</>}
             </button>
          </div>

          {mode === 'generate' && (
              <div className="flex gap-4 text-sm">
                  <select 
                    value={options.aspectRatio}
                    onChange={(e) => setOptions({...options, aspectRatio: e.target.value as any})}
                    className="bg-slate-800 text-white border border-gray-600 rounded p-2"
                  >
                      <option value="1:1">1:1 (Square)</option>
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="4:3">4:3</option>
                  </select>
                  <select 
                    value={options.size}
                    onChange={(e) => setOptions({...options, size: e.target.value as any})}
                    className="bg-slate-800 text-white border border-gray-600 rounded p-2"
                  >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                  </select>
              </div>
          )}

          {mode === 'edit' && (
             <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center bg-slate-800/50 hover:bg-slate-800 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile ? (
                    <p className="text-green-400 font-bold"><i className="fas fa-check mr-2"></i>{selectedFile.name}</p>
                ) : (
                    <p className="text-gray-400"><i className="fas fa-upload mr-2"></i>Click to upload base image for editing</p>
                )}
             </div>
          )}
        </div>
      </div>

      {resultImage && (
        <div className="bg-nikto-surface p-4 rounded-xl border border-gray-700 shadow-xl animate-fade-in flex flex-col items-center">
            <img src={resultImage} alt="Generated" className="max-w-full rounded-lg shadow-2xl mb-4" />
            <button 
                onClick={downloadImage}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full"
            >
                <i className="fas fa-download mr-2"></i> Download
            </button>
        </div>
      )}
    </div>
  );
};

export default ImageStudio;