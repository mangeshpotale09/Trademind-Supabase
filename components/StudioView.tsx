
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const StudioView: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateLogo = async () => {
    if (!process.env.API_KEY) {
      setError("API Key missing. Terminal restricted.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A professional, minimalist, high-tech app logo for a trading journal named TradeMind AI. Vector style, sleek emerald green and deep slate color palette. The design should incorporate abstract representations of a brain and a financial candlestick chart, modern and futuristic aesthetic, dark high-contrast background.',
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          setGeneratedLogo(`data:image/png;base64,${base64Data}`);
          break;
        }
      }
    } catch (err: any) {
      console.error("Logo Generation Failure:", err);
      setError("Cloud generation node failed. Re-syncing recommended.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">AI Branding <span className="text-fuchsia-500">Studio</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Generate Platform Visuals & Identity Assets</p>
        </div>
        
        <button 
          onClick={handleGenerateLogo}
          disabled={isGenerating}
          className={`flex items-center gap-4 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl ${
            isGenerating 
              ? 'bg-[#1e293b] text-slate-500 cursor-not-allowed' 
              : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-500/20 active:scale-95'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
              Synthesizing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.243a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.464 16.464a1 1 0 101.415-1.415l-.707-.707a1 1 0 00-1.415 1.415l.707.707z" /></svg>
              Generate Terminal Logo
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-[10px] font-black uppercase tracking-widest text-center animate-in shake">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative aspect-square md:aspect-video lg:aspect-square bg-[#0a0f1d] rounded-[3rem] border border-[#1e293b] flex flex-col items-center justify-center overflow-hidden group shadow-2xl">
          {generatedLogo ? (
            <>
              <img src={generatedLogo} alt="AI Generated Logo" className="w-full h-full object-contain p-12 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedLogo;
                    link.download = 'trademind-ai-logo.png';
                    link.click();
                  }}
                  className="bg-white text-slate-900 font-black px-8 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:scale-110 transition-transform"
                >
                  Download Asset
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 p-12 text-center">
              <div className={`w-32 h-32 rounded-[2.5rem] bg-slate-800/20 border border-slate-700/50 flex items-center justify-center text-5xl transition-all duration-1000 ${isGenerating ? 'animate-pulse scale-110 blur-sm' : ''}`}>
                {isGenerating ? '🔮' : '🖼️'}
              </div>
              <div>
                <h4 className="text-slate-400 font-black text-sm uppercase tracking-widest">Awaiting Synthesis</h4>
                <p className="text-slate-600 text-[10px] font-medium mt-2 max-w-xs">TradeMind AI Studio leverages high-bandwidth visual generation to create 1K professional branding assets.</p>
              </div>
            </div>
          )}
          
          {/* Technical scanning line */}
          {isGenerating && (
            <div className="absolute top-0 left-0 w-full h-1 bg-fuchsia-500/50 blur-sm animate-[scan_2s_infinite]"></div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#0e1421] p-8 rounded-[2.5rem] border border-[#1e293b] shadow-xl">
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></div>
              Synthesis Parameters
            </h4>
            <div className="space-y-4">
              <ParamRow label="Resolution" value="1024 x 1024" />
              <ParamRow label="Model" value="Gemini 2.5 Flash" />
              <ParamRow label="Style" value="Minimalist Vector" />
              <ParamRow label="Tone" value="Quant / Professional" />
            </div>
          </div>

          <div className="bg-[#0e1421] p-8 rounded-[2.5rem] border border-[#1e293b] shadow-xl">
             <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4">Prompt Logic</h4>
             <p className="text-slate-500 text-[11px] leading-relaxed font-medium italic">
               "Minimalist high-tech trading journal identity. Emerald green highlights on deep slate. Brain + Candlestick abstract fusion. Futuristic vector."
             </p>
          </div>

          <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem]">
             <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Node Information</h4>
             <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Visual synthesis requires significant GPU bandwidth. Please remain on this tab until the asset is fully committed to memory.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(600px); }
        }
      `}</style>
    </div>
  );
};

const ParamRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-[#1e293b] last:border-0">
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
    <span className="text-[11px] font-black text-slate-300 font-mono">{value}</span>
  </div>
);

export default StudioView;
