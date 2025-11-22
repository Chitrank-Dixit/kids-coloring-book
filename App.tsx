import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { BookOpen, Download, Loader2, Sparkles, Image as ImageIcon, Palette } from 'lucide-react';
import { AppState, GeneratedImage, ImageSize } from './types';
import { generateBookCover, generateColoringPage, resetChat } from './services/gemini';
import ApiKeySelector from './components/ApiKeySelector';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.API_KEY_SELECTION);
  const [theme, setTheme] = useState('');
  const [childName, setChildName] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.Size1K);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [progress, setProgress] = useState(0);

  // Check API key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
         // If key exists, valid env var should be present, we can skip selection
         if(process.env.API_KEY) {
            setAppState(AppState.INPUT);
         }
      }
    };
    checkKey();
  }, []);

  const handleStartGeneration = async () => {
    if (!theme || !childName) return;

    setAppState(AppState.GENERATING);
    setGeneratedImages([]);
    resetChat(); // Start fresh chat context for the new book
    
    try {
      // 1. Generate Cover
      setLoadingStep('Designing the cover...');
      setProgress(10);
      const coverData = await generateBookCover(theme, childName, imageSize);
      
      const coverImage: GeneratedImage = {
        id: 'cover',
        data: coverData,
        type: 'cover',
        prompt: `Cover for ${theme}`
      };
      
      setGeneratedImages(prev => [...prev, coverImage]);
      setProgress(30);

      // 2. Generate 5 Pages
      for (let i = 0; i < 5; i++) {
        setLoadingStep(`Drawing page ${i + 1} of 5...`);
        const pageData = await generateColoringPage(theme, i, imageSize);
        
        const pageImage: GeneratedImage = {
          id: `page-${i}`,
          data: pageData,
          type: 'page',
          prompt: `Page ${i+1} of ${theme}`
        };
        
        setGeneratedImages(prev => [...prev, pageImage]);
        // Calculate progress: 30 -> 100 across 5 steps
        setProgress(30 + ((i + 1) * 14)); 
      }

      setLoadingStep('Finishing touches...');
      setProgress(100);
      setTimeout(() => setAppState(AppState.PREVIEW), 500);

    } catch (error) {
      console.error(error);
      alert("Something went wrong while generating the book. Please try again.");
      setAppState(AppState.INPUT);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;

    generatedImages.forEach((img, index) => {
        if (index > 0) doc.addPage();

        // Add image centered
        // Assuming 3:4 aspect ratio from generation
        // A4 is ~210x297. 
        const imgWidth = 180;
        const imgHeight = 240;
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        doc.addImage(`data:image/png;base64,${img.data}`, 'PNG', x, y, imgWidth, imgHeight);
        
        if (img.type === 'page') {
             doc.setFontSize(10);
             doc.setTextColor(150);
             doc.text(`Page ${index} • ${theme}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
    });

    doc.save(`${childName.replace(/\s+/g, '_')}_${theme.replace(/\s+/g, '_')}_Coloring_Book.pdf`);
  };

  if (appState === AppState.API_KEY_SELECTION) {
    return <ApiKeySelector onKeySelected={() => setAppState(AppState.INPUT)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Magic Coloring Book</h1>
          </div>
          {appState === AppState.PREVIEW && (
            <button 
              onClick={() => setAppState(AppState.INPUT)}
              className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Create New
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        
        {/* Input State */}
        {appState === AppState.INPUT && (
          <div className="max-w-2xl mx-auto text-center space-y-8 fade-in">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-indigo-900">
                Create a custom <span className="text-indigo-600">coloring book</span> in seconds!
              </h2>
              <p className="text-lg text-slate-600 max-w-lg mx-auto">
                Using advanced Gemini AI, we'll generate unique pages tailored to your child's favorite things.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6 text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  What is the book about?
                </label>
                <div className="relative">
                  <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g., Space Dinosaurs, Magical Underwater Unicorns"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Child's Name
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g., Leo"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

               <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Image Quality (Resolution)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as ImageSize)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value={ImageSize.Size1K}>1K (Fast)</option>
                    <option value={ImageSize.Size2K}>2K (High Quality)</option>
                    <option value={ImageSize.Size4K}>4K (Ultra HD)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartGeneration}
                disabled={!theme || !childName}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xl py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.99]"
              >
                Generate Book ✨
              </button>
            </div>
          </div>
        )}

        {/* Generating State */}
        {appState === AppState.GENERATING && (
          <div className="max-w-xl mx-auto text-center pt-12 space-y-8">
             <div className="relative w-32 h-32 mx-auto">
               <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
               <div 
                 className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"
               ></div>
               <Sparkles className="absolute inset-0 m-auto text-yellow-400 w-12 h-12 animate-pulse" />
             </div>
             
             <div className="space-y-2">
               <h3 className="text-2xl font-bold text-slate-800 animate-pulse">{loadingStep}</h3>
               <p className="text-slate-500">This magic takes a moment...</p>
             </div>

             <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
               <div 
                 className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                 style={{ width: `${progress}%` }}
               ></div>
             </div>
          </div>
        )}

        {/* Preview State */}
        {appState === AppState.PREVIEW && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-indigo-900 text-white p-6 rounded-2xl shadow-lg">
              <div>
                <h2 className="text-2xl font-bold">Your Book is Ready!</h2>
                <p className="text-indigo-200">Ready to print for {childName}.</p>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-indigo-900 px-8 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((img) => (
                <div key={img.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group">
                  <div className="relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden mb-3">
                    <img 
                      src={`data:image/png;base64,${img.data}`} 
                      alt={img.prompt}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-center backdrop-blur-sm">
                      {img.type === 'cover' ? 'Cover Art' : 'Coloring Page'}
                    </div>
                  </div>
                  <p className="text-center font-medium text-slate-600 text-sm capitalize">
                    {img.type === 'cover' ? 'Book Cover' : img.prompt.split('Subject:')[0] || 'Coloring Page'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <ChatBot />
    </div>
  );
};

export default App;
