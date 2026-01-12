"use client";

import { useState, useEffect } from "react";
import { useFireData } from "./FireDataContext";
import { filterByTimeRange } from "../lib/time";

export type TimeRange = "6h" | "12h" | "24h" | "48h" | "7d";

interface MapControlsProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  lastDetection: Date | null;
}

export default function MapControls({
  timeRange,
  onTimeRangeChange,
  lastDetection,
}: MapControlsProps) {
  const { data, refresh } = useFireData();
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const allRanges: TimeRange[] = ["6h", "12h", "24h", "48h", "7d"];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const rangesWithData = allRanges.filter((range) => {
    const filtered = filterByTimeRange(data.features, range);
    return filtered.length > 0;
  });

  const getRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case "6h":
        return "6 horas";
      case "12h":
        return "12 horas";
      case "24h":
        return "24 horas";
      case "48h":
        return "48 horas";
      case "7d":
        return "7 días";
    }
  };

  const formatLastDetection = (): string => {
    if (!lastDetection) return "Sin detecciones";
    const now = new Date();
    const diffMs = now.getTime() - lastDetection.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `hace ${diffMins}m`;
    } else if (diffHours < 24) {
      const mins = diffMins % 60;
      return mins > 0 ? `hace ${diffHours}h ${mins}m` : `hace ${diffHours}h`;
    } else {
      return `hace ${diffDays}d`;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: isMobile ? "10px" : "10px",
        left: isMobile ? "10px" : "50%",
        right: isMobile ? "10px" : "auto",
        transform: isMobile ? "none" : "translateX(-50%)",
        background: "white",
        padding: isMobile ? "8px 12px" : "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        zIndex: 1000,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        gap: isMobile ? "8px" : "16px",
        maxWidth: isMobile ? "calc(100% - 20px)" : "auto",
      }}
    >
      {rangesWithData.length > 0 && (
        <div style={{ display: "flex", gap: isMobile ? "4px" : "8px", alignItems: "center", flexWrap: "wrap" }}>
          {rangesWithData.map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              style={{
                padding: isMobile ? "6px 8px" : "6px 12px",
                border: "1px solid #e8eaed",
                borderRadius: "4px",
                background: timeRange === range ? "#ff9800" : "white",
                color: timeRange === range ? "white" : "#202124",
                cursor: "pointer",
                fontSize: isMobile ? "11px" : "13px",
                fontWeight: timeRange === range ? "500" : "400",
                flex: isMobile ? "1 1 auto" : "none",
                minWidth: isMobile ? "60px" : "auto",
              }}
            >
              {getRangeLabel(range)}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: isMobile ? "6px 8px" : "6px 12px",
              border: "1px solid #e8eaed",
              borderRadius: "4px",
              background: isRefreshing ? "#f1f3f4" : "white",
              color: isRefreshing ? "#999" : "#202124",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              fontSize: isMobile ? "11px" : "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Actualizar datos ahora"
          >
            {isRefreshing ? "⟳" : "↻"} {isMobile ? "" : "Actualizar"}
          </button>
        </div>
      )}

      <div style={{ 
        fontSize: isMobile ? "11px" : "13px", 
        color: "#666", 
        borderLeft: isMobile ? "none" : "1px solid #e8eaed", 
        borderTop: isMobile ? "1px solid #e8eaed" : "none",
        paddingLeft: isMobile ? "0" : "16px",
        paddingTop: isMobile ? "8px" : "0",
        marginTop: isMobile ? "8px" : "0",
      }}>
        <div>
          <strong>Última detección:</strong>{" "}
          {lastDetection ? formatLastDetection() : <span style={{ color: "#999" }}>Sin detecciones</span>}
        </div>
        <div>
          <strong>Rango:</strong> {getRangeLabel(timeRange)}
        </div>
      </div>
    </div>
  );
}
