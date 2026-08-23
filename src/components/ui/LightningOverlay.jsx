'use client';

import { useEffect, useState } from 'react';

// Generates a single lightning branch
const generateLightningPath = (startX, startY, endX, endY) => {
  const segments = 20;
  const jaggedness = 45;
  let path = `M ${startX} ${startY}`;
  
  let currentX = startX;
  let currentY = startY;
  
  for (let i = 1; i <= segments; i++) {
    const fraction = i / segments;
    const targetX = startX + (endX - startX) * fraction;
    const targetY = startY + (endY - startY) * fraction;
    
    currentX = targetX + (Math.random() - 0.5) * jaggedness;
    currentY = targetY + (Math.random() - 0.5) * jaggedness;
    
    path += ` L ${currentX} ${currentY}`;
  }
  return path;
};

export default function LightningOverlay({ isActive }) {
  const [paths, setPaths] = useState([]);
  
  useEffect(() => {
    if (isActive) {
      // Generate 7 main lightning branches radiating from the profile dropdown area
      const startX = window.innerWidth > 768 ? window.innerWidth - 200 : window.innerWidth - 50;
      const startY = 100;
      
      const newPaths = [];
      for (let i = 0; i < 9; i++) {
        // Random end points scattering across the screen to the left and bottom
        const endX = Math.random() * (window.innerWidth * 0.7);
        const endY = window.innerHeight * (0.2 + Math.random() * 0.8);
        newPaths.push(generateLightningPath(startX, startY, endX, endY));
      }
      setPaths(newPaths);
    } else {
      setPaths([]);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9999999] pointer-events-none overflow-hidden mix-blend-screen">
      <svg className="w-full h-full">
        <defs>
          <filter id="lightning-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {paths.map((d, i) => {
          const delay = Math.random() * 0.3;
          return (
            <g key={i}>
              {/* Outer purple aura */}
              <path
                d={d}
                fill="none"
                stroke="#a855f7"
                strokeWidth="8"
                className="animate-lightning-flash opacity-80"
                style={{ animationDelay: `${delay}s`, filter: 'url(#lightning-glow)' }}
                strokeLinecap="round"
                strokeLinejoin="miter"
              />
              {/* Inner white hot core */}
              <path
                d={d}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                className="animate-lightning-flash"
                style={{ animationDelay: `${delay}s`, filter: 'url(#lightning-glow)' }}
                strokeLinecap="round"
                strokeLinejoin="miter"
              />
            </g>
          );
        })}
      </svg>
      {/* Screen flash after-effect */}
      <div className="absolute inset-0 bg-white/10 animate-screen-flash mix-blend-overlay"></div>
    </div>
  );
}
