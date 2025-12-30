
import React, { useState, useCallback, useRef } from 'react';
import { AppState, Config } from './types';
import ParticleCanvas from './components/ParticleCanvas';
import Sidebar from './components/Sidebar';
import GestureOverlay from './components/GestureOverlay';
import GestureProcessor from './services/GestureProcessor';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.BYE_2025);
  const [countdownValue, setCountdownValue] = useState<number>(5);
  const [detectedGestureLabel, setDetectedGestureLabel] = useState<string>('Initializing...');
  const [config, setConfig] = useState<Config>({
    particleDensity: 4000,
    particleSize: 1.8,
    bgAlpha: 0.2,
    palette: 'gold',
    showCamera: false,
  });

  const [currentLandmarks, setCurrentLandmarks] = useState<any[]>([]);

  const handleStateChange = useCallback((newState: AppState, count?: number) => {
    setAppState(newState);
    if (count !== undefined) setCountdownValue(count);
  }, []);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans select-none">
      {/* 粒子物理画布 */}
      <ParticleCanvas 
        appState={appState} 
        countdownValue={countdownValue}
        config={config}
        onLandmarksUpdate={setCurrentLandmarks}
      />

      {/* 逻辑判定层 */}
      <GestureProcessor 
        landmarks={currentLandmarks} 
        onStateChange={handleStateChange} 
        onGestureDetected={setDetectedGestureLabel}
      />

      {/* 指导面板 */}
      <GestureOverlay appState={appState} countdownValue={countdownValue} config={config} />

      {/* 实时反馈组件 - 位置稍微下移到 15% 处，给中央文字留出更多空间 */}
      <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full flex justify-center px-4">
        <div 
          key={detectedGestureLabel}
          className="px-4 py-2 sm:px-8 sm:py-3 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all animate-in zoom-in duration-300 max-w-xs sm:max-w-none text-center"
        >
           <span className="text-white text-sm sm:text-base font-bold tracking-[0.1em] sm:tracking-[0.2em] uppercase whitespace-normal sm:whitespace-nowrap">
              {detectedGestureLabel}
           </span>
        </div>
      </div>

      <Sidebar 
        config={config} 
        setConfig={setConfig} 
        appState={appState}
        setAppState={setAppState}
      />
      
      {/* 底部装饰 */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 opacity-30 z-10">
        <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-white" />
        <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.5em] font-light text-white whitespace-nowrap">
          Particle Alchemy 2026
        </div>
        <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-white" />
      </div>
    </div>
  );
};

export default App;
