import React, { useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sliders
} from 'lucide-react';

interface ZoomKnobControlProps {
  currentZoom?: number;
  onZoomChange: (newZoom: number) => void;
}

const MIN_ZOOM = 70;
const MAX_ZOOM = 150;

const PRESETS = [80, 90, 100, 110, 125];

export default function ZoomKnobControl({ currentZoom = 100, onZoomChange }: ZoomKnobControlProps) {
  const [zoom, setZoom] = useState<number>(currentZoom);

  useEffect(() => {
    if (currentZoom && currentZoom !== zoom) {
      setZoom(currentZoom);
    }
  }, [currentZoom]);

  const applyGlobalZoom = useCallback((zoomValue: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoomValue)));
    setZoom(clamped);
    
    try {
      (document.documentElement.style as unknown as { zoom: string }).zoom = `${clamped / 100}`;
      (document.body.style as unknown as { zoom: string }).zoom = `${clamped / 100}`;
      localStorage.setItem('taller_celulares_zoom', clamped.toString());
    } catch (e) {
      console.warn('Error applying zoom:', e);
    }

    onZoomChange(clamped);
  }, [onZoomChange]);

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Label & Current Level */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-[#FACC15] text-black flex items-center justify-center font-bold shadow-xs">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-gray-900 uppercase tracking-wide">
              Zoom de Pantalla
            </span>
            <span className="bg-black text-[#FACC15] text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
              {zoom}%
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            Ajusta el tamaño general de la aplicación
          </p>
        </div>
      </div>

      {/* Slider Bar & Step Buttons */}
      <div className="flex items-center space-x-2.5 flex-1 max-w-md">
        <button
          type="button"
          onClick={() => applyGlobalZoom(zoom - 5)}
          disabled={zoom <= MIN_ZOOM}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-700 font-black flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
          title="Reducir zoom 5%"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={1}
            value={zoom}
            onChange={(e) => applyGlobalZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E2B810] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => applyGlobalZoom(zoom + 5)}
          disabled={zoom >= MAX_ZOOM}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-700 font-black flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
          title="Aumentar zoom 5%"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Presets & Reset */}
      <div className="flex items-center space-x-1.5 shrink-0">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => applyGlobalZoom(preset)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              zoom === preset
                ? 'bg-black text-[#FACC15]'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {preset}%
          </button>
        ))}

        {zoom !== 100 && (
          <button
            type="button"
            onClick={() => applyGlobalZoom(100)}
            className="p-1 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer ml-1"
            title="Restablecer 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
