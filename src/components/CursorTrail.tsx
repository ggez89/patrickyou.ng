/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { CursorTrailParticle } from '../types';

export default function CursorTrail() {
  const [particles, setParticles] = useState<CursorTrailParticle[]>([]);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const activeParticles = useRef<CursorTrailParticle[]>([]);
  const particleIdCounter = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      // Calculate distance from last position to decide how many particles to spawn
      const dx = currentX - lastMousePos.current.x;
      const dy = currentY - lastMousePos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Save latest pos
      lastMousePos.current = { x: currentX, y: currentY };

      // Spawn particles if mouse moved sufficiently or on an interval
      if (dist > 3) {
        const count = Math.min(3, Math.floor(dist / 10) + 1);
        for (let i = 0; i < count; i++) {
          // Linear interpolation for smoother trail coverage on fast movements
          const ratio = i / count;
          const px = lastMousePos.current.x - dx * ratio;
          const py = lastMousePos.current.y - dy * ratio;

          // Vary colors: brilliant yellow, vibrant orange, warm amber, and pure white
          const colors = [
            'rgba(255, 220, 0, 0.85)',   // Radiant Yellow
            'rgba(255, 110, 0, 0.85)',   // Vibrant Orange
            'rgba(255, 170, 40, 0.85)',  // Warm Amber
            'rgba(255, 255, 255, 0.95)', // Pure White
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          const isMobile = window.innerWidth < 768;
          particleIdCounter.current += 1;
          const newParticle: CursorTrailParticle = {
            id: `p-${particleIdCounter.current}-${Math.random()}`,
            x: px,
            y: py,
            size: isMobile ? (Math.random() * 4 + 7) : (Math.random() * 8 + 14), // 50% smaller on mobile
            color,
            angle: Math.random() * 360,
            speed: Math.random() * 1.0 + 0.2, // Slightly slower drift to keep the cone shape compact
            opacity: 1,
            scale: 1,
          };

          activeParticles.current.push(newParticle);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as MouseEvent);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // RequestAnimationFrame update loop for maximum responsiveness and layout optimization
    let animId: number;
    const updateLoop = () => {
      const current = activeParticles.current;
      const updated: CursorTrailParticle[] = [];
      const isMobile = window.innerWidth < 768;

      for (let i = 0; i < current.length; i++) {
        const p = current[i];
        const nextOpacity = p.opacity - (isMobile ? 0.025 : 0.055); // Slower fade on mobile
        const nextScale = p.scale - (isMobile ? 0.035 : 0.07);      // Slower shrink on mobile

        if (nextOpacity > 0 && nextScale > 0) {
          // Slow drifting in particle's random course
          const radian = (p.angle * Math.PI) / 180;
          const nextX = p.x + Math.cos(radian) * p.speed * 0.4;
          const nextY = p.y + Math.sin(radian) * p.speed * 0.4 + 0.2; // Slight gravity/drift drift

          updated.push({
            ...p,
            x: nextX,
            y: nextY,
            opacity: nextOpacity,
            scale: nextScale,
          });
        }
      }

      activeParticles.current = updated;
      setParticles(updated);

      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div 
      id="cursor-trail-container"
      className="absolute inset-0 pointer-events-none overflow-hidden z-20"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          id={p.id}
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}`,
            transform: `translate3d(${p.x - p.size / 2}px, ${p.y - p.size / 2}px, 0) scale(${p.scale})`,
            opacity: p.opacity,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
