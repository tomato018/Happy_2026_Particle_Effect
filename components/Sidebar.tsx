
import React from 'react';
import { Config, AppState } from '../types';

interface SidebarProps {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  appState: AppState;
  setAppState: (state: AppState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, appState, setAppState }) => {
  // Helper to generate the minimalist track highlight
  const getSliderStyle = (val: number, min: number, max: number) => {
    const percentage = ((val - min) / (max - min)) * 100;
    return {
      background: `linear-gradient(to right, #d4cdd3 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%)`,
      height: '1px',
      margin: '8px 0'
    };
  };

  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 flex flex-col gap-2 sm:gap-3 p-3 sm:p-5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 w-44 sm:w-64 max-h-[85vh] sm:max-h-[calc(100vh-2rem)] overflow-y-auto transition-all hover:bg-black/80">
      <h2 className="text-sm sm:text-lg font-bold text-white/80 uppercase tracking-tighter mb-0.5">
        ⚙️ Vibe Settings
      </h2>

      <div className="space-y-2 sm:space-y-3">
        {/* Particle Density */}
        <div className="space-y-0.5 sm:space-y-1">
          <label className="text-[8px] sm:text-[10px] text-white/60 uppercase tracking-wider block font-medium">Density: {config.particleDensity}</label>
          <input 
            type="range" 
            min="1000" max="8000" step="500"
            value={config.particleDensity}
            style={getSliderStyle(config.particleDensity, 1000, 8000)}
            onChange={(e) => setConfig(prev => ({ ...prev, particleDensity: parseInt(e.target.value) }))}
          />
        </div>

        {/* Particle Size */}
        <div className="space-y-0.5 sm:space-y-1">
          <label className="text-[8px] sm:text-[10px] text-white/60 uppercase tracking-wider block font-medium">Size: {config.particleSize.toFixed(1)}</label>
          <input 
            type="range" 
            min="0.5" max="5" step="0.1"
            value={config.particleSize}
            style={getSliderStyle(config.particleSize, 0.5, 5)}
            onChange={(e) => setConfig(prev => ({ ...prev, particleSize: parseFloat(e.target.value) }))}
          />
        </div>

        {/* Background Alpha/Fluidity */}
        <div className="space-y-0.5 sm:space-y-1">
          <label className="text-[8px] sm:text-[10px] text-white/60 uppercase tracking-wider block font-medium">Fluidity: {config.bgAlpha.toFixed(2)}</label>
          <input 
            type="range" 
            min="0.05" max="0.5" step="0.01"
            value={config.bgAlpha}
            style={getSliderStyle(config.bgAlpha, 0.05, 0.5)}
            onChange={(e) => setConfig(prev => ({ ...prev, bgAlpha: parseFloat(e.target.value) }))}
          />
        </div>

        {/* Palette Selection */}
        <div className="space-y-1.5 pt-1.5 border-t border-white/10">
          <label className="text-[8px] sm:text-[10px] text-white/60 uppercase tracking-wider block font-medium">Color Theme</label>
          <div className="flex gap-1.5">
            {(['sunset', 'gold', 'rosegold'] as const).map(p => (
              <button
                key={p}
                onClick={() => setConfig(prev => ({ ...prev, palette: p }))}
                className={`flex-1 h-5 sm:h-7 rounded-lg border-2 transition-all ${config.palette === p ? 'border-white scale-105' : 'border-transparent opacity-60'}`}
                style={{ background: p === 'sunset' ? '#f59d2a' : p === 'gold' ? '#FFD700' : '#fccfee' }}
              />
            ))}
          </div>
        </div>

        {/* Camera Toggle */}
        <div className="flex items-center justify-between pt-1 sm:pt-1.5">
          <span className="text-[8px] sm:text-[10px] text-white/60 uppercase tracking-wider font-medium">Show Camera</span>
          <button 
            onClick={() => setConfig(prev => ({ ...prev, showCamera: !prev.showCamera }))}
            className={`w-8 sm:w-10 h-3.5 sm:h-5 rounded-full p-0.5 transition-colors`}
            style={{ backgroundColor: config.showCamera ? '#d4cdd3' : '#374151' }}
          >
            <div className={`w-2.5 sm:w-4 h-2.5 sm:h-4 bg-white rounded-full transition-transform ${config.showCamera ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Manual State Toggle */}
        <div className="pt-2 sm:pt-3 flex flex-wrap gap-1.5">
          <button 
            onClick={() => setAppState(AppState.BYE_2025)}
            className="text-[7px] sm:text-[9px] px-2 py-1 bg-white/10 border border-white/10 rounded-md hover:bg-white/20 transition-colors text-white/80"
          >
            Reset
          </button>
          <button 
            onClick={() => setAppState(AppState.HAPPY_2026)}
            className="text-[7px] sm:text-[9px] px-2 py-1 bg-white/10 border border-white/10 rounded-md text-white font-bold uppercase tracking-wider hover:bg-white/20 transition-all force-boom-shadow"
          >
            Force Boom
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
