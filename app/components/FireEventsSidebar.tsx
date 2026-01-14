"use client";

import { useEffect, useState, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { FireEvent } from "../lib/clustering";
import { toArgentinaTimeString, timeAgo } from "../lib/time";

interface FireEventsSidebarProps {
  events: FireEvent[];
}

export default function FireEventsSidebar({ events }: FireEventsSidebarProps) {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!sidebarRef.current) return;

    const sidebarEl = sidebarRef.current;

    L.DomEvent.disableClickPropagation(sidebarEl);
    L.DomEvent.disableScrollPropagation(sidebarEl);

    const stopPropagation = (e: Event) => {
      L.DomEvent.stopPropagation(e);
    };

    sidebarEl.addEventListener("wheel", stopPropagation, { passive: false });
    sidebarEl.addEventListener("touchmove", stopPropagation, { passive: false });
    sidebarEl.addEventListener("touchstart", stopPropagation, { passive: false });
    sidebarEl.addEventListener("touchend", stopPropagation, { passive: false });

    return () => {
      sidebarEl.removeEventListener("wheel", stopPropagation);
      sidebarEl.removeEventListener("touchmove", stopPropagation);
      sidebarEl.removeEventListener("touchstart", stopPropagation);
      sidebarEl.removeEventListener("touchend", stopPropagation);
    };
  }, []);

  const handleEventClick = (event: FireEvent) => {
    const [lat, lon] = event.centroid;
    map.setView([lat, lon], 12, { animate: true, duration: 0.5 });
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "absolute",
            left: "0",
            top: "50%",
            transform: "translateY(-50%)",
            width: isMobile ? "36px" : "40px",
            height: isMobile ? "60px" : "80px",
            background: "white",
            border: "none",
            borderRadius: "0 8px 8px 0",
            boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
            cursor: "pointer",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobile ? "18px" : "20px",
            color: "#5F6368",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = "#f1f3f4";
              e.currentTarget.style.width = "44px";
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.width = "40px";
            }
          }}
          title="Mostrar lista de incendios"
        >
          ▶
        </button>
      )}
      {isOpen && !isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            background: "rgba(0, 0, 0, 0.3)",
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        ref={sidebarRef}
        style={{
          position: "absolute",
          left: isOpen ? "0" : isMobile ? "-100%" : "-300px",
          top: "0",
          width: isMobile ? "85%" : "300px",
          maxWidth: isMobile ? "320px" : "300px",
          height: "100%",
          background: "white",
          boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
          transition: "left 0.3s ease",
          overflowY: "auto",
          touchAction: "pan-y",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e8eaed",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "white",
            zIndex: 1,
          }}
        >
          <h2 style={{ margin: 0, fontSize: isMobile ? "16px" : "18px", fontWeight: "500", color: "#202124" }}>
            Incendios ({events.length})
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "#f8f9fa",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              fontSize: "20px",
              color: "#5F6368",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
              width: "36px",
              height: "36px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f3f4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f8f9fa";
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>

      <div style={{ padding: "8px" }}>
        {events.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: "#999", fontSize: "13px" }}>
            Sin detecciones recientes en este rango
          </div>
        ) : (
          events.map((event) => {
            const [lat, lon] = event.centroid;
            return (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: "1px solid #e8eaed",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e8f5e9";
                  e.currentTarget.style.borderColor = "#ff9800";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f8f9fa";
                  e.currentTarget.style.borderColor = "#e8eaed";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: event.trend === "creciente" ? "#d32f2f" 
                        : event.trend === "decreciente" ? "#388e3c" 
                        : event.trend === "extinto" ? "#757575" 
                        : "#ff9800",
                      marginRight: "8px",
                    }}
                  />
                  <strong style={{ fontSize: isMobile ? "13px" : "14px", color: "#202124" }}>
                    {event.placeName || `Incendio #${event.id.replace("event-", "")}`}
                  </strong>
                </div>
                <div style={{ fontSize: isMobile ? "11px" : "12px", color: "#666", marginLeft: "20px" }}>
                  <div>Detecciones (48h): {event.count}</div>
                  {event.count24h !== undefined && event.historicalCount !== undefined && (
                    <>
                      <div>Detecciones últimas 24h: {event.count24h}</div>
                      <div>Detecciones (24h-48h): {event.historicalCount}</div>
                    </>
                  )}
                  {event.frp24h !== undefined && event.frp24h_48h !== undefined && (
                    <>
                      <div style={{ marginTop: "4px", fontWeight: "bold" }}>
                        FRP últimas 24h: {event.frp24h.toFixed(1)}
                      </div>
                      <div>FRP (24h-48h): {event.frp24h_48h.toFixed(1)}</div>
                    </>
                  )}
                  {event.trend && (
                    <div style={{ 
                      color: event.trend === "creciente" ? "#d32f2f" 
                        : event.trend === "decreciente" ? "#388e3c" 
                        : event.trend === "extinto" ? "#757575" 
                        : "#ff9800" 
                    }}>
                      Tendencia: {event.trend === "creciente" ? "↑ Creciente" 
                        : event.trend === "decreciente" ? "↓ Decreciente" 
                        : event.trend === "extinto" ? "○ Extinto"
                        : "→ Estable"}
                    </div>
                  )}
                  <div>FRP: {event.frpSum.toFixed(1)}</div>
                  <div>Última: {toArgentinaTimeString(new Date(event.lastSeenUtcMs))}</div>
                  <div>Hace: {timeAgo(new Date(event.lastSeenUtcMs))}</div>
                  {(event.windSpeed !== undefined || event.precipitation !== undefined) && (
                    <>
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e8eaed" }}>
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "#1976d2", marginBottom: "4px" }}>Meteorología:</div>
                        {event.windSpeed !== undefined && event.windDir !== undefined && (
                          <div style={{ fontSize: "11px", color: "#666" }}>
                            Viento: {event.windSpeed.toFixed(1)} m/s, {event.windDir.toFixed(0)}°
                          </div>
                        )}
                        {event.precipitation !== undefined && (
                          <div style={{ fontSize: "11px", color: "#666" }}>
                            Precipitación: {event.precipitation > 0 ? `${event.precipitation.toFixed(1)} mm/h` : "Sin lluvia"}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
    </>
  );
}
