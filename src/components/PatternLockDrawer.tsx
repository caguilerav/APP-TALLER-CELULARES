import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PatternLockDrawerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PatternLockDrawer({ value, onChange }: PatternLockDrawerProps) {
  const [activeDots, setActiveDots] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert pattern string (e.g., "1-2-3") to array of numbers
  useEffect(() => {
    if (!value) {
      setActiveDots([]);
    } else {
      const dots = value.split('-').map(Number).filter(n => !isNaN(n));
      // Only set if different to avoid infinite loop
      if (dots.join('-') !== activeDots.join('-')) {
        setActiveDots(dots);
      }
    }
  }, [value]);

  const handleDotActivation = (num: number) => {
    if (activeDots.includes(num)) return;
    const newDots = [...activeDots, num];
    setActiveDots(newDots);
    onChange(newDots.join('-'));
  };

  const getDotCoords = (num: number) => {
    // num is 1-9. Col: (num-1)%3, Row: Math.floor((num-1)/3)
    const col = (num - 1) % 3;
    const row = Math.floor((num - 1) / 3);
    // Return relative percentages for the SVG lines
    return {
      x: `${16.66 + col * 33.33}%`,
      y: `${16.66 + row * 33.33}%`
    };
  };

  const handleStart = (num: number) => {
    setIsDrawing(true);
    setActiveDots([num]);
    onChange(String(num));
  };

  const handleMouseEnter = (num: number) => {
    if (isDrawing) {
      handleDotActivation(num);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  // Listen to mouse/touch up globally to stop drawing
  useEffect(() => {
    const handleGlobalUp = () => {
      setIsDrawing(false);
    };
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing || !containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Find if touch is close to any of the 9 dots
    const cellWidth = rect.width / 3;
    const cellHeight = rect.height / 3;

    for (let i = 1; i <= 9; i++) {
      const col = (i - 1) % 3;
      const row = Math.floor((i - 1) / 3);
      const dotX = cellWidth * (col + 0.5);
      const dotY = cellHeight * (row + 0.5);

      const distance = Math.hypot(x - dotX, y - dotY);
      // If within 25 pixels (or 15% of cell), activate
      if (distance < Math.min(cellWidth, cellHeight) * 0.35) {
        handleDotActivation(i);
        break;
      }
    }
  };

  const clearPattern = () => {
    setActiveDots([]);
    onChange('');
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center space-y-4 shadow-inner max-w-xs mx-auto">
      <div className="w-full flex justify-between items-center px-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {activeDots.length > 0 ? 'Patrón Dibujado' : 'Dibuja el Patrón'}
        </span>
        <button
          type="button"
          onClick={clearPattern}
          title="Borrar patrón"
          className="text-gray-400 hover:text-gray-900 transition-colors p-1 bg-white hover:bg-gray-100 rounded-lg border border-gray-100 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pattern Drawing Area */}
      <div 
        ref={containerRef}
        onTouchMove={handleTouchMove}
        className="relative w-56 h-56 bg-white rounded-2xl border border-gray-200/80 shadow-md p-2 select-none touch-none"
      >
        {/* SVG Drawing Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {activeDots.map((dot, idx) => {
            if (idx === 0) return null;
            const prevDot = activeDots[idx - 1];
            const start = getDotCoords(prevDot);
            const end = getDotCoords(dot);
            return (
              <line
                key={`line-${idx}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#FACC15"
                strokeWidth="6"
                strokeLinecap="round"
                className="opacity-90 animate-pulse"
              />
            );
          })}
        </svg>

        {/* 3x3 Dots Grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-4 z-10">
          {Array.from({ length: 9 }).map((_, index) => {
            const num = index + 1;
            const isActive = activeDots.includes(num);
            const isLast = activeDots[activeDots.length - 1] === num;
            
            return (
              <div 
                key={num}
                className="flex items-center justify-center relative"
              >
                <button
                  type="button"
                  onMouseDown={() => handleStart(num)}
                  onTouchStart={() => handleStart(num)}
                  onMouseEnter={() => handleMouseEnter(num)}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all focus:outline-none relative group"
                >
                  {/* Outer glowing border for active or hover */}
                  <div className={`absolute inset-0 rounded-full border-2 transition-all scale-75 group-hover:scale-100 ${
                    isActive 
                      ? 'border-yellow-400 bg-yellow-50/50 scale-100' 
                      : 'border-transparent group-hover:border-gray-200'
                  }`} />

                  {/* Center Dot */}
                  <div className={`w-4 h-4 rounded-full transition-all ${
                    isActive 
                      ? isLast 
                        ? 'bg-yellow-500 scale-125 shadow-lg shadow-yellow-500/50' 
                        : 'bg-yellow-400 scale-100'
                      : 'bg-gray-300 group-hover:bg-gray-400'
                  }`} />
                  
                  {/* Visual Indicator of Number */}
                  <span className="absolute bottom-0 text-[9px] font-mono font-bold text-gray-400 pointer-events-none">
                    {num}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pattern sequence display */}
      <div className="w-full text-center py-1.5 bg-white border border-gray-100 rounded-xl">
        {activeDots.length > 0 ? (
          <div className="flex flex-col items-center space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Secuencia</span>
            <div className="flex items-center gap-1 flex-wrap justify-center font-mono text-xs font-bold text-gray-800">
              {activeDots.map((dot, idx) => (
                <React.Fragment key={dot}>
                  {idx > 0 && <span className="text-yellow-500 font-extrabold text-sm">→</span>}
                  <span className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center">
                    {dot}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-xs font-medium text-gray-400">
            Mantén presionado y desliza o haz clic para conectar los puntos
          </span>
        )}
      </div>
    </div>
  );
}
