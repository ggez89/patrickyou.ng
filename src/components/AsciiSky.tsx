/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { AuroraStrandType, MousePaintStroke } from '../types';

export default function AsciiSky() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Settings and animation states using refs to prevent React re-renders from killing FPS
  const time = useRef(0);
  const strands = useRef<AuroraStrandType[]>([]);
  const paintStrokes = useRef<MousePaintStroke[]>([]);
  const strokeIdCounter = useRef(0);
  
  // Mouse coordinates tracking
  const mouse = useRef({ x: 0, y: 0, easeX: 0, easeY: 0, lastStrokeX: 0, lastStrokeY: 0 });

  // Initializing strands
  useEffect(() => {
    // Standard starting aurora strands
    const initialStrands: AuroraStrandType[] = [];
    for (let i = 0; i < 5; i++) {
      initialStrands.push({
        baseX: -0.05 + Math.random() * 1.1,
        phaseOffset: Math.random() * 500,
        speedFactor: 0.5 + Math.random() * 0.8,
        thicknessScale: Math.pow(Math.random(), 1.5),
        alpha: 1.0,
        targetAlpha: 1.0,
        fadeSpeed: 0.001 + Math.random() * 0.003,
        waveFreqY1: 0.0015 + Math.random() * 0.0025,
        waveFreqY2: 0.006 + Math.random() * 0.006,
      });
    }
    strands.current = initialStrands;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const chars = " .-',:;+=*xX%#@&$";
    const charLength = chars.length;

    let fontSize = 11;
    let charWidth = 10;
    let charHeight = 11;
    let cols = 0;
    let rows = 0;

    let maxConcurrentStrands = 15;
    let minThicknessFloor = 35;
    let lateralSwayLarge = 160;
    let lateralSwaySmall = 45;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;

      // Handle font size adaptations for resolution to optimize viewport boundaries and calculations
      if (width >= 2560) {
        fontSize = 18;
      } else if (width >= 1920) {
        fontSize = 14;
      } else if (width < 480) {
        fontSize = 11; // Ensure details visible on mobile
      } else {
        fontSize = 12;
      }

      ctx.font = `${fontSize}px monospace`;
      charWidth = ctx.measureText("M").width;
      charHeight = fontSize * 1.1;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Setting physical buffer resolution with reasonable limits for maximum performance on Retina displays
      const targetDpr = Math.min(dpr, 1.5); 
      canvas.width = Math.floor(width * targetDpr);
      canvas.height = Math.floor(height * targetDpr);
      ctx.scale(targetDpr, targetDpr);

      cols = Math.ceil(width / charWidth);
      rows = Math.ceil(height / charHeight);

      if (isMobile) {
        maxConcurrentStrands = 5;
        minThicknessFloor = 25;
        lateralSwayLarge = width * 0.18;
        lateralSwaySmall = width * 0.05;
      } else {
        maxConcurrentStrands = 15;
        minThicknessFloor = 35;
        lateralSwayLarge = 160;
        lateralSwaySmall = 45;
      }
    };

    handleResize();
    
    // Set initial custom mouse center
    mouse.current.x = window.innerWidth * 0.5;
    mouse.current.y = window.innerHeight * 0.5;
    mouse.current.easeX = mouse.current.x;
    mouse.current.easeY = mouse.current.y;
    mouse.current.lastStrokeX = mouse.current.x;
    mouse.current.lastStrokeY = mouse.current.y;

    window.addEventListener('resize', handleResize);

    const onMove = (clientX: number, clientY: number) => {
      mouse.current.x = clientX;
      mouse.current.y = clientY;

      // Calculate path distance to throttle adding paint segments
      const dx = clientX - mouse.current.lastStrokeX;
      const dy = clientY - mouse.current.lastStrokeY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const isMobile = window.innerWidth < 768;

      // Add a blue paint stroke if the cursor has drifted enough distance (approx 15px)
      if (dist > 15 || paintStrokes.current.length === 0) {
        strokeIdCounter.current += 1;
        const newStroke: MousePaintStroke = {
          x: clientX,
          y: clientY,
          radius: isMobile ? (Math.random() * 30 + 55) : (Math.random() * 60 + 110), // 50% smaller on mobile
          intensity: 1.0,
          decayRate: 0.014 + Math.random() * 0.008, // fades in roughly 1-2 seconds
          id: `stroke-${strokeIdCounter.current}`,
        };
        
        // Push and keep size manageable
        paintStrokes.current.push(newStroke);
        if (paintStrokes.current.length > 30) {
          paintStrokes.current.shift();
        }

        mouse.current.lastStrokeX = clientX;
        mouse.current.lastStrokeY = clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      onMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    let animationFrameId: number;

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;

      // Smooth camera position follow
      mouse.current.easeX += (mouse.current.x - mouse.current.easeX) * 0.055;
      mouse.current.easeY += (mouse.current.y - mouse.current.easeY) * 0.055;

      // 1. Draw pure dark cosmos backgroung first
      ctx.fillStyle = '#010204';
      ctx.fillRect(0, 0, width, height);

      // 2. Painting the sky blue: Draw glowing radial blue backgrounds along the paint trail on the GPU
      if (paintStrokes.current.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        for (let i = 0; i < paintStrokes.current.length; i++) {
          const stroke = paintStrokes.current[i];
          if (stroke.intensity <= 0.01) continue;

          const grad = ctx.createRadialGradient(
            stroke.x, stroke.y, 5,
            stroke.x, stroke.y, stroke.radius
          );
          
          // Deep cosmos indigo-blue profile fading to darkness
          grad.addColorStop(0, `rgba(12, 60, 240, ${stroke.intensity * 0.32})`);
          grad.addColorStop(0.4, `rgba(4, 25, 140, ${stroke.intensity * 0.14})`);
          grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(stroke.x, stroke.y, stroke.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = "top";

      time.current += isMobile ? 0.008 : 0.016; // Stable delta simulation clock, 50% slower on mobile

      // Update strands lists and remove those that are fully cooled down/faded
      const activeStrands = strands.current;
      for (let i = activeStrands.length - 1; i >= 0; i--) {
        const st = activeStrands[i];
        if (st.alpha < st.targetAlpha) {
          st.alpha = Math.min(st.targetAlpha, st.alpha + st.fadeSpeed);
        } else if (st.alpha > st.targetAlpha) {
          st.alpha = Math.max(st.targetAlpha, st.alpha - st.fadeSpeed);
        }

        if (st.targetAlpha === 0 && st.alpha <= 0.001) {
          activeStrands.splice(i, 1);
        }
      }

      // Update paint stroke intensities
      const activeStrokes = paintStrokes.current;
      for (let i = activeStrokes.length - 1; i >= 0; i--) {
        const stroke = activeStrokes[i];
        stroke.intensity -= stroke.decayRate;
        if (stroke.intensity <= 0) {
          activeStrokes.splice(i, 1);
        }
      }

      // Sporadic spawning of strands to animate auroral flow dynamics slowly
      if (Math.random() < 0.02) {
        const livingCount = activeStrands.filter(s => s.targetAlpha === 1.0).length;
        if (livingCount < maxConcurrentStrands && (Math.random() > 0.3 || livingCount <= 2)) {
          activeStrands.push({
            baseX: -0.05 + Math.random() * 1.1,
            phaseOffset: Math.random() * 500,
            speedFactor: 0.4 + Math.random() * 0.7,
            thicknessScale: Math.pow(Math.random(), 1.5),
            alpha: 0.0,
            targetAlpha: 1.0,
            fadeSpeed: 0.001 + Math.random() * 0.003,
            waveFreqY1: 0.0015 + Math.random() * 0.0025,
            waveFreqY2: 0.006 + Math.random() * 0.006,
          });
        } else if (livingCount > 3) {
          const upStrands = activeStrands.filter(s => s.targetAlpha === 1.0);
          const victim = upStrands[Math.floor(Math.random() * upStrands.length)];
          if (victim) victim.targetAlpha = 0.0;
        }
      }

      // CRITICAL OPTIMIZATION: Bounding Box Limiting & Spatial Bucketing for rows
      // We process the strands positions at each row y-coordinate in advance
      const rowStrandCache = new Array(rows);
      for (let r = 0; r < rows; r++) {
        const y = r * charHeight;
        const cachedStrands = [];
        const screenEdgeFade = Math.pow(Math.sin((y / height) * Math.PI), 0.3);

        for (let s = 0; s < activeStrands.length; s++) {
          const st = activeStrands[s];
          if (st.alpha <= 0.005) continue;

          // Compute horizontal strand center
          const strandX = width * st.baseX
                        + Math.sin(y * st.waveFreqY1 + time.current * 1.5 * st.speedFactor + st.phaseOffset) * lateralSwayLarge
                        + Math.cos(y * st.waveFreqY2 - time.current * 0.7 * st.speedFactor) * lateralSwaySmall;

          // Define thicknesses based on resolution constraint
          const baseThickness = isMobile 
                              ? (32 + st.thicknessScale * 75) 
                              : (48 + st.thicknessScale * 180);

          let currentWidth = baseThickness 
                           + Math.sin(y * 0.006 + time.current * 1.8 + st.phaseOffset) * (baseThickness * 0.4)
                           + Math.cos(y * 0.015 - time.current * 1.1) * (baseThickness * 0.15);
          
          currentWidth = Math.max(minThicknessFloor, currentWidth);

          cachedStrands.push({
            strandX,
            width: currentWidth,
            alphaWeight: st.alpha * screenEdgeFade,
            colMin: Math.max(0, Math.floor((strandX - currentWidth * 2.5 - 75) / charWidth)), // Added wobble pad
            colMax: Math.min(cols - 1, Math.ceil((strandX + currentWidth * 2.5 + 75) / charWidth)) // Added wobble pad
          });
        }
        rowStrandCache[r] = cachedStrands;
      }

      // Process drawing of characters column by column inside structured row containers
      const mouseEaseX = mouse.current.easeX;
      const mouseEaseY = mouse.current.easeY;
      
      const rValGrid = new Float32Array(cols * rows);
      const gValGrid = new Float32Array(cols * rows);
      const bValGrid = new Float32Array(cols * rows);
      const activePixelsMap = new Uint8Array(cols * rows); // 1 = render, 0 = skip

      // Fast evaluation maps using localized bounds for strands
      for (let r = 0; r < rows; r++) {
        const y = r * charHeight;
        const activeRowStrands = rowStrandCache[r];
        if (activeRowStrands.length === 0) continue;

        for (let s = 0; s < activeRowStrands.length; s++) {
          const rStrand = activeRowStrands[s];
          
          // Only iterate through columns that fall inside this strand's bounding range
          for (let c = rStrand.colMin; c <= rStrand.colMax; c++) {
            const x = c * charWidth;
            const gridIdx = r * cols + c;

            // Compute mouse offset for interactive wobble
            const mDx = x - mouseEaseX;
            const mDy = y - mouseEaseY;
            const mDistSq = mDx * mDx + mDy * mDy;
            
            let evalX = x;

            if (mDistSq < 122500) { // 350px interactive sphere
              const mDist = Math.sqrt(mDistSq);
              const power = (1.0 - mDist / 350);
              const factor = power * power * 70;
              evalX += Math.sin(time.current * 1.2 + y * 0.01) * factor;
            }

            const dX = Math.abs(evalX - rStrand.strandX);
            if (dX > rStrand.width * 2.5) continue;

            // Math Optimization: Precalculate products and use clean gauss coefficients
            const inverseRadius = 1.0 / rStrand.width;
            const normalizedDx = dX * inverseRadius;
            const intensity = Math.exp(-(normalizedDx * normalizedDx)) * rStrand.alphaWeight;
            
            if (intensity < 0.005) continue;

            const greenCoreWidth = rStrand.width * 0.48;
            const inverseGreenCore = 1.0 / greenCoreWidth;
            const normalizedCoreDx = dX * inverseGreenCore;
            const coreGreen = Math.exp(-(normalizedCoreDx * normalizedCoreDx)) * intensity;
            
            const fringePurple = Math.max(0, intensity - coreGreen) * 0.38;

            rValGrid[gridIdx] += (coreGreen * 8)   + (fringePurple * 245);
            gValGrid[gridIdx] += (coreGreen * 255) + (fringePurple * 15);
            bValGrid[gridIdx] += (coreGreen * 115) + (fringePurple * 215);

            activePixelsMap[gridIdx] = 1;
          }
        }
      }

      // Let's sweep active paint strokes and paint the sky blue locally
      const listStrokes = activeStrokes;
      const hasStrokes = listStrokes.length > 0;

      // Draw all ASCII characters that meet critical brightness bounds
      for (let r = 0; r < rows; r++) {
        const y = r * charHeight;
        
        for (let c = 0; c < cols; c++) {
          const x = c * charWidth;
          const gridIdx = r * cols + c;

          let rVal = rValGrid[gridIdx];
          let gVal = gValGrid[gridIdx];
          let bVal = bValGrid[gridIdx];
          let isActive = activePixelsMap[gridIdx] === 1;

          // Paint Sky Blue interaction logic
          let bluePaintVal = 0;
          if (hasStrokes) {
            for (let p = 0; p < listStrokes.length; p++) {
              const strk = listStrokes[p];
              const dX = x - strk.x;
              const dY = y - strk.y;
              const distSq = dX * dX + dY * dY;
              const rSq = strk.radius * strk.radius;
              if (distSq < rSq) {
                const dist = Math.sqrt(distSq);
                bluePaintVal += (1.0 - dist / strk.radius) * strk.intensity;
              }
            }
            bluePaintVal = Math.min(1.0, bluePaintVal);
          }

          let brightness = Math.max(rVal, gVal, bVal) / 255;

          // Smoothly dye the characters a brilliant electric cyan-blue color inside the paint trail!
          if (bluePaintVal > 0.02) {
            isActive = true; // Always paint trail characters and never leave black space gaps
            
            // High-octane sky blue character coloring
            const paintedR = (brightness * 255 * 0.0) + (bluePaintVal * 15);
            const paintedG = (brightness * 255 * 0.72) + (bluePaintVal * 150);
            const paintedB = (brightness * 255 * 1.0) + (bluePaintVal * 255);

            rVal = rVal * (1.0 - bluePaintVal) + paintedR * bluePaintVal;
            gVal = gVal * (1.0 - bluePaintVal) + paintedG * bluePaintVal;
            bVal = bVal * (1.0 - bluePaintVal) + paintedB * bluePaintVal;
            brightness = Math.max(brightness, bluePaintVal * 0.65); // High brightness floor so trail stays strong and solid
          }

          if (!isActive || brightness < 0.016) continue;

          const charIdx = Math.floor(Math.min(0.99, brightness) * charLength);
          const char = chars[charIdx];

          // Set fill color and write
          ctx.fillStyle = `rgb(${Math.min(255, Math.floor(rVal))}, ${Math.min(255, Math.floor(gVal))}, ${Math.min(255, Math.floor(bVal))})`;
          ctx.fillText(char, x, y);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      id="ascii-canvas"
      className="absolute top-0 left-0 w-full h-full block z-1"
    />
  );
}
