import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// Simple inline icons to ensure no external dependency issues
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

const WandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

const LoaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

function App() {
  const [prompt, setPrompt] = useState(
    "Create a professional logo for any project. The logo should combine a high-tech and the project name in a bold, modern typeface. The style should be sleek, trustworthy, and authoritative."
  );
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError("Please enter a description for your logo.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const parts: any[] = [];
      
      // Add image if available
      if (inputImage) {
        // Extract base64 data and mime type
        const match = inputImage.match(/^data:(.+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      // Add text prompt
      parts.push({ text: prompt });

      // Using gemini-2.5-flash-image as requested for general image tasks
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
      });

      // Parse response for image
      let foundImage = false;
      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || "image/png";
            setGeneratedImage(`data:${mimeType};base64,${base64Data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        // Fallback check if text explains why no image came back
        const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
        if (textPart) {
          throw new Error(textPart.text || "The model returned text but no image.");
        } else {
          throw new Error("No image generated.");
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-10 px-4">
      <header className="mb-10 text-center max-w-2xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Logo Studio
        </h1>
        <p className="text-slate-400 text-lg">
          Powered by Gemini 2.5 Flash. Upload your reference photo or describe your vision to generate professional logo.
        </p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Controls Section */}
        <div className="space-y-6 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reference Image (Optional)
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-slate-700/50 transition-all group"
            >
              {inputImage ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                   <img src={inputImage} alt="Reference" className="w-full h-full object-contain" />
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-medium">Click to change</p>
                   </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-slate-400 group-hover:text-emerald-400">
                    <UploadIcon />
                  </div>
                  <p className="text-slate-300 font-medium">Upload Drone Photo</p>
                  <p className="text-slate-500 text-sm mt-1">Supports PNG, JPG</p>
                </>
              )}
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Design Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-40 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              placeholder="Describe the logo you want to create..."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
              ${isLoading 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-emerald-900/20'
              }`}
          >
            {isLoading ? (
              <>
                <LoaderIcon /> Generating...
              </>
            ) : (
              <>
                <WandIcon /> Generate Logo
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-800/50 text-red-200 rounded-xl text-sm">
              Error: {error}
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
               <ImageIcon /> Result
             </h2>
             {generatedImage && (
               <a 
                 href={generatedImage} 
                 download="ravnresq-logo.png"
                 className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors text-slate-200"
               >
                 <DownloadIcon /> Download
               </a>
             )}
          </div>
          
          <div className="flex-1 bg-slate-900/50 rounded-xl border-2 border-slate-700/50 flex items-center justify-center overflow-hidden relative">
            {isLoading ? (
               <div className="flex flex-col items-center gap-4 animate-pulse">
                 <div className="w-16 h-16 rounded-full border-4 border-slate-600 border-t-emerald-500 animate-spin"></div>
                 <p className="text-slate-400 font-mono text-sm">Processing with Gemini...</p>
               </div>
            ) : generatedImage ? (
              <img 
                src={generatedImage} 
                alt="Generated Logo" 
                className="max-w-full max-h-full object-contain shadow-2xl"
              />
            ) : (
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 mb-4 text-slate-600">
                  <ImageIcon />
                </div>
                <p className="text-slate-500 text-lg">Your generated logo will appear here</p>
                <p className="text-slate-600 text-sm mt-2 max-w-xs mx-auto">
                  Try uploading a sketch or existing dphoto to guide the design.
                </p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
