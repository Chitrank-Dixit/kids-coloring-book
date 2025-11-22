import React, { useState } from 'react';
import { Key } from 'lucide-react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [error, setError] = useState<string | null>(null);

  const handleSelectKey = async () => {
    setError(null);
    try {
      // Trigger the key selection dialog
      await window.aistudio.openSelectKey();
      
      // In strict mode/real implementation, we assume success if no error thrown
      // Initialize our service with the env var that is now populated
      if (process.env.API_KEY) {
        onKeySelected();
      } else {
        // Fallback check if env wasn't immediately ready (rare race condition handling)
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey && process.env.API_KEY) {
          onKeySelected();
        } else {
           setError("Key selection incomplete. Please try again.");
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes("Requested entity was not found")) {
        setError("Key not found. Please select a valid project/key.");
      } else {
        setError("Failed to select API Key. Please ensure you are in a supported environment.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          API Key Required
        </h1>
        <p className="text-slate-600 mb-8">
          To generate high-quality 2K/4K images with Nano Banana Pro (Gemini 3 Pro Image), you need to select a paid API key from your Google Cloud project.
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSelectKey}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Select API Key
        </button>

        <p className="mt-6 text-xs text-slate-400">
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-indigo-500"
          >
            Learn more about Gemini API billing
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeySelector;