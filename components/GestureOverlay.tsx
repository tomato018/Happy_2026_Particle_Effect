
import React from 'react';
import { AppState, Config, PALETTES } from '../types';

interface Props {
  appState: AppState;
  countdownValue: number;
  config: Config;
}

const GestureOverlay: React.FC<Props> = ({ appState, countdownValue, config }) => {
  // Get the primary color from the current palette for theming
  const paletteColors = PALETTES[config.palette];
  const themeColor = Array.isArray(paletteColors) ? paletteColors[0] : paletteColors;

  return (
    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50 p-3 sm:p-4 space-y-1 sm:space-y-2 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 pointer-events-none w-auto max-w-[200px] sm:max-w-xs">
      <h3 className="text-[9px] sm:text-xs font-bold text-white/80 uppercase tracking-tighter mb-1 sm:mb-2">👋 Gesture Control Guide</h3>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-base sm:text-lg shrink-0">🖐️</span>
        <span className="text-[9px] sm:text-[11px] text-white/60 leading-tight">5-1 Fingers: Countdown</span>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-base sm:text-lg shrink-0">✊</span>
        <span className="text-[9px] sm:text-[11px] text-white/60 leading-tight">
          Fist (0 Fingers): <b style={{ color: themeColor }}>HAPPY 2026</b>
        </span>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-base sm:text-lg shrink-0">🤙</span>
        <span className="text-[9px] sm:text-[11px] text-white/60 leading-tight">"Six" Hand: Back to 2025</span>
      </div>

      <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-white/10">
         <div className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-tighter">Status: 
            <span 
              className="ml-2 font-mono font-bold" 
              style={{ color: appState === AppState.HAPPY_2026 ? themeColor : '#00BFFF' }}
            >
               {appState.replace('_', ' ')} {appState === AppState.COUNTDOWN ? `[${countdownValue}]` : ''}
            </span>
         </div>
      </div>
    </div>
  );
};

export default GestureOverlay;
