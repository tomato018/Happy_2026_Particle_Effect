
import React, { useEffect, useRef } from 'react';
import { AppState } from '../types';

interface GestureProcessorProps {
  onStateChange: (state: AppState, value?: number) => void;
  landmarks: any[];
  onGestureDetected?: (gesture: string) => void;
}

// Stability configurations - Optimized for responsiveness
const NUMERIC_STABILITY_THRESHOLD = 4; 
const EXPLOSION_STABILITY_THRESHOLD = 1; // Immediate trigger for the explosion
const RESET_STABILITY_THRESHOLD = 6;
const STATE_COOLDOWN_MS = 600; 

const GestureProcessor: React.FC<GestureProcessorProps> = ({ onStateChange, landmarks, onGestureDetected }) => {
  const lastConfirmedGesture = useRef<string>('');
  const voteCounter = useRef<Record<string, number>>({});
  const lastRawGesture = useRef<string>('');
  const lastStateChangeTime = useRef<number>(0);
  const internalAppState = useRef<AppState>(AppState.BYE_2025);

  useEffect(() => {
    if (!landmarks || landmarks.length === 0) {
      if (onGestureDetected) onGestureDetected('WAITING FOR HAND...');
      return;
    }

    const now = Date.now();
    const h = landmarks[0];
    const wrist = h[0];
    const thumbTip = h[4];
    const indexMCP = h[5];
    const middleMCP = h[9];
    const ringMCP = h[13];
    const pinkyMCP = h[17];

    const getDist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    
    // Use the distance from wrist to middle finger MCP as the baseline for hand scale
    const palmSize = getDist(wrist, middleMCP);

    /**
     * Determines if a finger is extended by comparing the distance of the tip and PIP to the wrist,
     * normalized by the palm size to remain robust against hand rotation/scaling.
     */
    const isFingerExtended = (tipIdx: number, pipIdx: number, mcpIdx: number, thresholdRatio: number) => {
      const tipDist = getDist(h[tipIdx], wrist);
      const pipDist = getDist(h[pipIdx], wrist);
      const mcpDist = getDist(h[mcpIdx], wrist);
      
      // A finger is extended if the tip is significantly further from the wrist than the MCP
      // and the tip is further than the PIP.
      return (tipDist - mcpDist) / palmSize > thresholdRatio && tipDist > pipDist;
    };

    /**
     * Thumb extension is unique; we check its distance from the wrist and the palm (index MCP)
     */
    const isThumbExtended = () => {
      const distToWrist = getDist(thumbTip, wrist);
      const distToIP = getDist(h[3], wrist);
      const distToIndexMCP = getDist(thumbTip, indexMCP);
      
      // Thumb is extended if it's pushed away from the palm horizontally
      return distToWrist > distToIP && distToIndexMCP / palmSize > 0.6;
    };

    // Extension states with specific thresholds per finger
    const fI = isFingerExtended(8, 6, 5, 0.4);  // Index
    const fM = isFingerExtended(12, 10, 9, 0.4); // Middle
    const fR = isFingerExtended(16, 14, 13, 0.35); // Ring
    const fP = isFingerExtended(20, 18, 17, 0.3);  // Pinky
    const fT = isThumbExtended();

    // Curl states (for precise "Six" or "Fist" detection)
    const isCurled = (tipIdx: number, mcpIdx: number) => getDist(h[tipIdx], wrist) < getDist(h[mcpIdx], wrist) * 1.15;
    const cI = isCurled(8, 5);
    const cM = isCurled(12, 9);
    const cR = isCurled(16, 13);

    let currentRaw = '';
    let label = '';

    // 1. Gesture: "Six" / "Call Me" (🤙) - Thumb + Pinky out, others definitely curled
    if (fT && fP && cI && cM && cR) {
      currentRaw = 'SIX';
      label = '🤙 RESET TO 2025';
    } 
    // 2. Gesture: "Fist" (✊) - All fingers curled or very close to palm
    else if (!fI && !fM && !fR && !fP) {
      currentRaw = 'FIST';
      label = '✊ READY TO BOOM';
    } 
    // 3. Numeric Gestures (1-5)
    else {
      const fingers = [fI, fM, fR, fP];
      const fingerCount = fingers.filter(Boolean).length;
      let total = fingerCount + (fT ? 1 : 0);

      // Heuristic to fix common 4 vs 5 confusion:
      if (fingerCount === 4 && !fT && getDist(thumbTip, indexMCP) / palmSize > 0.5) {
          total = 5;
      }
      
      if (fI && fM && fR && !fP && !fT && getDist(h[20], wrist) / getDist(h[17], wrist) > 1.1) {
          total = 4;
      }

      if (total === 0) {
        currentRaw = 'FIST';
        label = '✊ READY TO BOOM';
      } else {
        currentRaw = Math.min(total, 5).toString();
        label = `COUNTING: ${currentRaw}`;
      }
    }

    // Voting for stability
    if (currentRaw === lastRawGesture.current) {
      voteCounter.current[currentRaw] = (voteCounter.current[currentRaw] || 0) + 1;
    } else {
      voteCounter.current = { [currentRaw]: 1 };
      lastRawGesture.current = currentRaw;
    }

    // Immediate action detection for FIST
    const isExplosionTrigger = currentRaw === 'FIST' && internalAppState.current !== AppState.HAPPY_2026;

    // Cooldown check - Bypassed for the explosion trigger
    if (!isExplosionTrigger && now - lastStateChangeTime.current < STATE_COOLDOWN_MS) return;

    let requiredThreshold = NUMERIC_STABILITY_THRESHOLD;
    if (currentRaw === 'FIST') requiredThreshold = EXPLOSION_STABILITY_THRESHOLD;
    if (currentRaw === 'SIX') requiredThreshold = RESET_STABILITY_THRESHOLD;

    if (voteCounter.current[currentRaw] >= requiredThreshold) {
      if (currentRaw !== lastConfirmedGesture.current) {
        lastConfirmedGesture.current = currentRaw;
        if (onGestureDetected) onGestureDetected(label);
        
        if (currentRaw === 'FIST') {
          if (internalAppState.current !== AppState.HAPPY_2026) {
            internalAppState.current = AppState.HAPPY_2026;
            lastStateChangeTime.current = now;
            onStateChange(AppState.HAPPY_2026);
          }
        } else if (currentRaw === 'SIX') {
          if (internalAppState.current !== AppState.BYE_2025) {
            internalAppState.current = AppState.BYE_2025;
            lastStateChangeTime.current = now;
            onStateChange(AppState.BYE_2025);
          }
        } else {
          const num = parseInt(currentRaw);
          if (!isNaN(num) && num >= 1) {
            internalAppState.current = AppState.COUNTDOWN;
            onStateChange(AppState.COUNTDOWN, num);
          }
        }
      }
    }

  }, [landmarks, onStateChange, onGestureDetected]);

  return null;
};

export default GestureProcessor;
