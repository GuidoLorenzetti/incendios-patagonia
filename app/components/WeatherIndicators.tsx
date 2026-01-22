"use client";

import { useState, useEffect } from "react";
import { useWeatherData } from "./WeatherDataContext";

export default function WeatherIndicators() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const { data, loading } = useWeatherData();

  if (loading || data.length === 0) {
    return null;
  }

  const avgWindSpeed = data.reduce((sum, p) => sum + p.windSpeed, 0) / data.length;
  
  const sinSum = data.reduce((sum, p) => sum + Math.sin((p.windDir * Math.PI) / 180), 0);
  const cosSum = data.reduce((sum, p) => sum + Math.cos((p.windDir * Math.PI) / 180), 0);
  const avgWindDir = (Math.atan2(sinSum / data.length, cosSum / data.length) * 180) / Math.PI;
  
  const maxPrecipitation = Math.max(...data.map((p) => p.precipitation));

  const getWindDirectionName = (deg: number): string => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return directions[Math.round(deg / 22.5) % 16];
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: isMobile ? "10px" : "20px",
        right: isMobile ? "10px" : "20px",
        left: isMobile ? "auto" : "auto",
        background: "white",
        borderRadius: isMobile ? "8px" : "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        padding: isMobile ? "10px" : "12px",
        zIndex: 1000,
        minWidth: isMobile ? "140px" : "180px",
        maxWidth: isMobile ? "calc(50% - 20px)" : "auto",
        border: "1px solid #e8eaed",
      }}
    >
      <div style={{ marginBottom: isMobile ? "8px" : "10px", fontSize: isMobile ? "11px" : "13px", fontWeight: "600", color: "#202124", borderBottom: "1px solid #e8eaed", paddingBottom: isMobile ? "4px" : "6px" }}>
        Meteorología
      </div>

      <div style={{ marginBottom: isMobile ? "8px" : "10px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: isMobile ? "16px" : "20px", height: isMobile ? "16px" : "20px", marginRight: isMobile ? "6px" : "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={isMobile ? "14" : "18"} height={isMobile ? "14" : "18"} style={{ transform: `rotate(${avgWindDir - 90}deg)` }}>
              <defs>
                <marker id={`wind-arrow-${Date.now()}`} markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
                  <polygon points="0 0, 7 2.5, 0 5" fill="rgba(33, 150, 243, 0.9)" />
                </marker>
              </defs>
              <line x1="9" y1="9" x2="16" y2="9" stroke="rgba(33, 150, 243, 0.9)" strokeWidth="2" markerEnd={`url(#wind-arrow-${Date.now()})`} />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: "500", color: "#202124" }}>Viento</div>
            <div style={{ fontSize: isMobile ? "9px" : "11px", color: "#666" }}>
              {avgWindSpeed.toFixed(1)} m/s {getWindDirectionName(avgWindDir)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: isMobile ? "16px" : "20px", height: isMobile ? "16px" : "20px", marginRight: isMobile ? "6px" : "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={isMobile ? "14" : "18"} height={isMobile ? "14" : "18"} viewBox="0 0 20 20">
              <path
                d="M10 2 L12 8 L18 8 L13 12 L15 18 L10 14 L5 18 L7 12 L2 8 L8 8 Z"
                fill={maxPrecipitation > 0 ? "rgba(33, 150, 243, 0.8)" : "rgba(200, 200, 200, 0.5)"}
              />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: "500", color: "#202124" }}>Precipitación</div>
            <div style={{ fontSize: isMobile ? "9px" : "11px", color: "#666" }}>
              {maxPrecipitation > 0 ? `${maxPrecipitation.toFixed(1)} mm/h` : "Sin lluvia"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
