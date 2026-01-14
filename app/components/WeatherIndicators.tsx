"use client";

import { useWeatherData } from "./WeatherDataContext";

export default function WeatherIndicators() {
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
        bottom: "20px",
        right: "20px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        padding: "12px",
        zIndex: 1000,
        minWidth: "180px",
        border: "1px solid #e8eaed",
      }}
    >
      <div style={{ marginBottom: "10px", fontSize: "13px", fontWeight: "600", color: "#202124", borderBottom: "1px solid #e8eaed", paddingBottom: "6px" }}>
        Meteorología
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "20px", height: "20px", marginRight: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" style={{ transform: `rotate(${avgWindDir - 90}deg)` }}>
              <defs>
                <marker id={`wind-arrow-${Date.now()}`} markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
                  <polygon points="0 0, 7 2.5, 0 5" fill="rgba(33, 150, 243, 0.9)" />
                </marker>
              </defs>
              <line x1="9" y1="9" x2="16" y2="9" stroke="rgba(33, 150, 243, 0.9)" strokeWidth="2" markerEnd={`url(#wind-arrow-${Date.now()})`} />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: "500", color: "#202124" }}>Viento</div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              {avgWindSpeed.toFixed(1)} m/s {getWindDirectionName(avgWindDir)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "20px", height: "20px", marginRight: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 20 20">
              <path
                d="M10 2 L12 8 L18 8 L13 12 L15 18 L10 14 L5 18 L7 12 L2 8 L8 8 Z"
                fill={maxPrecipitation > 0 ? "rgba(33, 150, 243, 0.8)" : "rgba(200, 200, 200, 0.5)"}
              />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: "500", color: "#202124" }}>Precipitación</div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              {maxPrecipitation > 0 ? `${maxPrecipitation.toFixed(1)} mm/h` : "Sin lluvia"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
