
import React, { useEffect, useRef } from 'react';
import { AppState, Config, Particle, FireworkParticle, PALETTES } from '../types';

interface Props {
  appState: AppState;
  countdownValue: number;
  config: Config;
  onLandmarksUpdate: (landmarks: any[]) => void;
}

declare var Hands: any;
declare var Camera: any;

interface SmoothParticle extends Particle {
  prevTx: number;
  prevTy: number;
  lastEffectiveTx: number;
  lastEffectiveTy: number;
}

const ParticleCanvas: React.FC<Props> = ({ appState, countdownValue, config, onLandmarksUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const particlesRef = useRef<SmoothParticle[]>([]);
  const fireworksRef = useRef<FireworkParticle[]>([]);
  const animationRef = useRef<number>(0);
  const handLandmarksRef = useRef<any[]>([]);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastStateRef = useRef<{state: AppState, count: number}>({state: AppState.BYE_2025, count: 5});
  
  const hasSpawnedFireworks = useRef<boolean>(false);
  const transitionStartTimeRef = useRef<number>(Date.now());
  const transitionDuration = 500;

  useEffect(() => {
    if (!videoRef.current) return;
    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.75
    });
    hands.onResults((results: any) => {
      const lms = results.multiHandLandmarks || [];
      onLandmarksUpdate(lms);
      handLandmarksRef.current = lms;
    });
    const camera = new Camera(videoRef.current, {
      onFrame: async () => { if (videoRef.current) await hands.send({ image: videoRef.current }); },
      width: 640, height: 480
    });
    camera.start();
    return () => { camera.stop(); hands.close(); };
  }, [onLandmarksUpdate]);

  const spawnFireworks = (x: number, y: number, colorPalette: string[]) => {
    const count = 40;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      fireworksRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        size: Math.random() * 2 + 1
      });
    }
  };

  const generateTargets = (text: string, count: number, canvas: HTMLCanvasElement): {x: number, y: number}[] => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // 平板/手机端 UI 适配逻辑
    const isMobile = w < 768;
    const isTablet = w >= 768 && w < 1024;
    
    // 计算 UI 占据的空间，预留充足的水平边距
    const leftPanelReserved = isMobile ? 180 : (isTablet ? 220 : 280); 
    const rightPanelReserved = isMobile ? 180 : (isTablet ? 220 : 280);
    const horizontalPadding = isMobile ? 20 : 40;
    
    const availableW = Math.max(w - (leftPanelReserved + rightPanelReserved) - horizontalPadding, w * 0.5);
    
    // 垂直方向：明确避让底部的反馈框 (约占 15%) 和装饰文字
    // 顶部也预留一部分空间 (约 10%)
    const topMargin = h * 0.1;
    const bottomMargin = h * 0.22; // 增加避让高度，确保文字不跑到底部
    const availableH = h - topMargin - bottomMargin;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = text.split('\n');
    
    const getMaxFontSize = () => {
      // 初始字号设高一点，增加视觉冲击力
      let size = isMobile ? 160 : (isTablet ? 240 : 400); 
      const maxIter = 100;
      for(let i=0; i<maxIter; i++) {
        ctx.font = `900 ${size}px "Arial Black", sans-serif`;
        const maxWidth = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
        const totalHeight = lines.length * size * 1.1;

        if (maxWidth <= availableW && totalHeight <= availableH) {
          // 倒计时允许占据更多垂直空间
          if (text.length <= 2 && totalHeight < availableH * 0.85) {
             size += 2;
             continue;
          }
          return size;
        }
        size -= 4;
        if (size <= 20) return 20;
      }
      return size;
    };

    const fontSize = getMaxFontSize();
    ctx.font = `900 ${fontSize}px "Arial Black", sans-serif`;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'white';
    
    // 强制居中点在 48% 处，既平衡了顶部 Sidebar，也完美避开了底部 Feedback
    const centerY = h * 0.48;
    
    lines.forEach((line, i) => {
        const yOffset = (i - (lines.length - 1) / 2) * fontSize * 1.05;
        ctx.fillText(line, w / 2, centerY + yOffset);
    });

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const points: {x: number, y: number}[] = [];
    const step = 4;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 128) points.push({ x, y });
      }
    }
    
    points.sort(() => Math.random() - 0.5);
    const result: {x: number, y: number}[] = [];
    if (points.length === 0) return Array(count).fill({x: w/2, y: h/2});
    for (let i = 0; i < count; i++) result.push(points[i % points.length]);
    return result;
  };

  const initParticles = (count: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    particlesRef.current = Array.from({ length: count }, () => {
      const px = Math.random() * w;
      const py = Math.random() * h;
      return {
        x: px, y: py,
        vx: 0, vy: 0, 
        tx: px, ty: py,
        prevTx: px, prevTy: py,
        lastEffectiveTx: px, lastEffectiveTy: py,
        size: config.particleSize, color: '#ffffff',
        active: true, alpha: 1, originX: 0, originY: 0
      };
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    if (!offscreenCanvasRef.current) offscreenCanvasRef.current = document.createElement('canvas');

    const updateStateTargets = () => {
      let text = "BYE 2025";
      if (appState === AppState.COUNTDOWN) text = countdownValue.toString();
      if (appState === AppState.HAPPY_2026) text = "HAPPY\n2026";

      const targets = generateTargets(text, config.particleDensity, offscreenCanvasRef.current!);
      const palette = config.palette;
      
      const getTargetColor = (idx: number) => {
        if (appState === AppState.BYE_2025) return PALETTES.cool[idx % PALETTES.cool.length];
        if (appState === AppState.COUNTDOWN) return PALETTES.countdown;
        const p = PALETTES[palette];
        return p[idx % p.length];
      };

      if (particlesRef.current.length !== config.particleDensity) initParticles(config.particleDensity);

      const stateChanged = appState !== lastStateRef.current.state || (appState === AppState.COUNTDOWN && countdownValue !== lastStateRef.current.count);
      
      if (stateChanged) {
        transitionStartTimeRef.current = Date.now();
        particlesRef.current.forEach(p => {
           p.prevTx = p.lastEffectiveTx;
           p.prevTy = p.lastEffectiveTy;
        });

        if (appState !== AppState.HAPPY_2026) {
          hasSpawnedFireworks.current = false;
        }

        if (appState === AppState.HAPPY_2026 && !hasSpawnedFireworks.current) {
          hasSpawnedFireworks.current = true;
          const w = window.innerWidth;
          const h = window.innerHeight;
          for(let i=0; i<8; i++) {
            setTimeout(() => {
              spawnFireworks(Math.random() * w, Math.random() * h * 0.7, PALETTES[palette]);
            }, i * 200);
          }
        }
      }

      lastStateRef.current = {state: appState, count: countdownValue};

      particlesRef.current.forEach((p, i) => {
        const target = targets[i];
        p.tx = target.x;
        p.ty = target.y;
        p.color = getTargetColor(i);
        
        if (stateChanged) {
           if (appState === AppState.COUNTDOWN) {
              p.vx = 0; p.vy = 0; 
           } else if (appState === AppState.HAPPY_2026) {
              const angle = Math.random() * Math.PI * 2;
              const force = Math.random() * 30 + 30;
              p.vx += Math.cos(angle) * force;
              p.vy += Math.sin(angle) * force;
           }
        }
      });
    };

    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      updateStateTargets();
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = `rgba(0, 0, 0, ${config.bgAlpha})`;
      ctx.fillRect(0, 0, w, h);

      const elapsed = Date.now() - transitionStartTimeRef.current;
      const progress = Math.min(elapsed / transitionDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const isCountdown = appState === AppState.COUNTDOWN;
      const isHappy = appState === AppState.HAPPY_2026;

      const attraction = isCountdown ? 0.45 : (isHappy ? 0.015 : 0.012);
      const friction = isCountdown ? 0.55 : (isHappy ? 0.88 : 0.90); 

      const partArr = particlesRef.current;
      const pSize = config.particleSize;

      for(let i = 0; i < partArr.length; i++) {
        const p = partArr[i];
        const curTargetX = p.prevTx + (p.tx - p.prevTx) * eased;
        const curTargetY = p.prevTy + (p.ty - p.prevTy) * eased;
        p.lastEffectiveTx = curTargetX;
        p.lastEffectiveTy = curTargetY;

        const dx = curTargetX - p.x;
        const dy = curTargetY - p.y;
        
        p.vx += dx * attraction;
        p.vy += dy * attraction;
        p.vx *= friction;
        p.vy *= friction;
        
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && !isCountdown) {
           p.vx *= 0.2;
           p.vy *= 0.2;
        }

        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, pSize, pSize);
      }

      const fwArr = fireworksRef.current;
      for (let i = fwArr.length - 1; i >= 0; i--) {
        const fp = fwArr[i];
        fp.vx *= 0.96;
        fp.vy *= 0.96;
        fp.vy += 0.05; 
        fp.x += fp.vx;
        fp.y += fp.vy;
        fp.life -= 0.015;
        if (fp.life <= 0) {
          fwArr.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = fp.life;
        ctx.fillStyle = fp.color;
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [appState, countdownValue, config]);

  return (
    <div className="absolute inset-0">
      <video ref={videoRef} className="hidden" playsInline muted />
      {config.showCamera && (
        <video 
           autoPlay muted playsInline 
           className="absolute inset-0 w-full h-full object-cover opacity-20 contrast-125 saturate-150"
           ref={(el) => { if (el && !el.srcObject && videoRef.current?.srcObject) el.srcObject = videoRef.current.srcObject; }}
        />
      )}
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default ParticleCanvas;
