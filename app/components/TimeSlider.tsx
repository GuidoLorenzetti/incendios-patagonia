"use client";

import { useState, useEffect, useRef } from "react";
import { useFireData } from "./FireDataContext";
import { parseFirmsUtc, timeAgo } from "../lib/time";

interface TimeSliderProps {
  selectedTime: Date | null;
  onTimeChange: (time: Date) => void;
  windowHours: number;
  maxTimeRangeHours?: number;
}

export default function TimeSlider({ selectedTime, onTimeChange, windowHours, maxTimeRangeHours = 120 }: TimeSliderProps) {
  const { data } = useFireData();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const now = new Date();
  const maxTime = now.getTime();
  const minTime = maxTime - (maxTimeRangeHours * 60 * 60 * 1000);

  const intervalStepMs = 3 * 60 * 60 * 1000;
  const stepMinutes = 15;
  const stepMs = stepMinutes * 60 * 1000;
  
  const totalSteps = Math.floor((maxTime - minTime) / stepMs);
  const intervals: number[] = [];
  for (let i = 0; i <= totalSteps; i++) {
    intervals.push(minTime + (i * stepMs));
  }

  const maxAvailableTime = maxTime;
  const minAvailableTime = minTime;

  const currentTime = selectedTime ? selectedTime.getTime() : maxAvailableTime;
  const timeRange = maxAvailableTime - minAvailableTime;
  // Invertir el slider: lo más nuevo (maxAvailableTime) a la izquierda (0), lo más viejo a la derecha (100)
  const sliderValue = timeRange > 0 
    ? Math.max(0, Math.min(100, 100 - ((currentTime - minAvailableTime) / timeRange) * 100))
    : 0;

  useEffect(() => {
    if (!selectedTime) {
      onTimeChange(new Date(maxAvailableTime));
    }
  }, [maxAvailableTime, selectedTime, onTimeChange]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const currentTimestamp = selectedTime?.getTime() || maxAvailableTime;
        // Reproducir hacia atrás en el tiempo (más viejo)
        const nextTime = currentTimestamp - intervalStepMs;
        
        if (nextTime >= minAvailableTime) {
          onTimeChange(new Date(nextTime));
        } else {
          setIsPlaying(false);
        }
      }, 1000 / playbackSpeed);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isPlaying, selectedTime, playbackSpeed, onTimeChange, maxAvailableTime, minAvailableTime, intervalStepMs]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (maxAvailableTime > minAvailableTime) {
      // Invertir: value 0 = maxAvailableTime, value 100 = minAvailableTime
      const invertedValue = 100 - value;
      const newTime = minAvailableTime + (invertedValue / 100) * (maxAvailableTime - minAvailableTime);
      const roundedTime = Math.round(newTime / intervalStepMs) * intervalStepMs;
      const clampedTime = Math.max(minAvailableTime, Math.min(maxAvailableTime, roundedTime));
      onTimeChange(new Date(clampedTime));
    }
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    const currentTimestamp = selectedTime?.getTime() || maxAvailableTime;
    // Anterior = más nuevo (hacia la izquierda)
    const nextTime = currentTimestamp + intervalStepMs;
    if (nextTime <= maxAvailableTime) {
      onTimeChange(new Date(nextTime));
    }
    setIsPlaying(false);
  };

  const handleNext = () => {
    const currentTimestamp = selectedTime?.getTime() || maxAvailableTime;
    // Siguiente = más viejo (hacia la derecha)
    const prevTime = currentTimestamp - intervalStepMs;
    if (prevTime >= minAvailableTime) {
      onTimeChange(new Date(prevTime));
    }
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    onTimeChange(new Date(maxAvailableTime));
    setIsPlaying(false);
  };

  // Formatear tiempo en múltiplos de 3 horas para el primer día, luego solo días
  const formatTimeLabel = (time: Date | null): string => {
    if (!time) return "";
    
    const diffMs = now.getTime() - time.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Si es muy reciente (menos de 1.5 horas), mostrar "Ahora"
    if (diffHours < 1.5) {
      return "Ahora";
    }
    
    // Si es menos de 24 horas, usar múltiplos de 3 horas
    if (diffHours < 24) {
      const roundedHours = Math.round(diffHours / 3) * 3;
      return `Hace ${roundedHours} horas`;
    }
    
    // Después del primer día, solo mostrar días (sin horas)
    const days = Math.floor(diffHours / 24);
    return `Hace ${days} ${days === 1 ? "día" : "días"}`;
  };

  const currentTimeStr = selectedTime ? formatTimeLabel(selectedTime) : "";

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .time-slider-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #e8eaed 0%, #e8eaed 100%);
          outline: none;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .time-slider-range:hover {
          background: linear-gradient(to right, #d0d3d6 0%, #d0d3d6 100%);
        }
        
        .time-slider-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1976d2;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }
        
        .time-slider-range::-webkit-slider-thumb:hover {
          background: #1565c0;
          transform: scale(1.1);
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        }
        
        .time-slider-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1976d2;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }
        
        .time-slider-range::-moz-range-thumb:hover {
          background: #1565c0;
          transform: scale(1.1);
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        }
        
        .time-slider-range::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: #e8eaed;
        }
      `}} />
      <div
        style={{
          position: "absolute",
          top: isMobile ? "8px" : "10px",
          left: isMobile ? "8px" : "50%",
          right: isMobile ? "8px" : "auto",
          transform: isMobile ? "none" : "translateX(-50%)",
          background: "white",
          padding: isMobile ? "10px" : "16px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 999,
          width: isMobile ? "calc(100% - 16px)" : "600px",
          maxWidth: isMobile ? "calc(100% - 16px)" : "calc(50% - 100px)",
        }}
      >
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ fontSize: isMobile ? "11px" : "12px", color: "#666", marginBottom: "4px", fontWeight: "500" }}>
            {currentTimeStr}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            style={{
              padding: "4px 8px",
              border: "1px solid #e8eaed",
              borderRadius: "4px",
              fontSize: isMobile ? "10px" : "11px",
              background: "white",
            }}
            disabled={!isPlaying}
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
        <input
          type="range"
          className="time-slider-range"
          min="0"
          max="100"
          step="0.01"
          value={sliderValue}
          onChange={handleSliderChange}
          style={{
            flex: 1,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
        <button
          onClick={handleReset}
          style={{
            padding: isMobile ? "6px 10px" : "8px 12px",
            border: "1px solid #e8eaed",
            borderRadius: "6px",
            background: "white",
            cursor: "pointer",
            fontSize: isMobile ? "11px" : "12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          title="Ir al final"
        >
          ⏮
        </button>
        <button
          onClick={handlePrevious}
          style={{
            padding: isMobile ? "6px 10px" : "8px 12px",
            border: "1px solid #e8eaed",
            borderRadius: "6px",
            background: "white",
            cursor: "pointer",
            fontSize: isMobile ? "11px" : "12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          title="Anterior"
        >
          ⏪
        </button>
        <button
          onClick={handlePlayPause}
          style={{
            padding: isMobile ? "8px 14px" : "10px 18px",
            border: "1px solid #e8eaed",
            borderRadius: "6px",
            background: isPlaying ? "#ff9800" : "white",
            color: isPlaying ? "white" : "#202124",
            cursor: "pointer",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          title={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button
          onClick={handleNext}
          style={{
            padding: isMobile ? "6px 10px" : "8px 12px",
            border: "1px solid #e8eaed",
            borderRadius: "6px",
            background: "white",
            cursor: "pointer",
            fontSize: isMobile ? "11px" : "12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          title="Siguiente"
        >
          ⏩
        </button>
      </div>
    </div>
    </>
  );
}
