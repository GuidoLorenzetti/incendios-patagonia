"use client";

import { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface ControlPanelProps {
  showPoints: boolean;
  showHeatmap: boolean;
  showEvents: boolean;
  showWeather: boolean;
  onPointsToggle: (visible: boolean) => void;
  onHeatmapToggle: (visible: boolean) => void;
  onEventsToggle: (visible: boolean) => void;
  onWeatherToggle: (visible: boolean) => void;
}

export default function ControlPanel({
  showPoints,
  showHeatmap,
  showEvents,
  showWeather,
  onPointsToggle,
  onHeatmapToggle,
  onEventsToggle,
  onWeatherToggle,
}: ControlPanelProps) {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [currentBaseLayer, setCurrentBaseLayer] = useState<"map" | "sat">("map");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    osmLayer.addTo(map);
    setCurrentBaseLayer("map");

    return () => {
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map]);

  const toggleBaseLayer = () => {
    const newLayer = currentBaseLayer === "map" ? "sat" : "map";
    setCurrentBaseLayer(newLayer);

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (newLayer === "map") {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    } else {
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      }).addTo(map);
    }
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: isMobile ? "10px" : "10px",
          right: isMobile ? "10px" : "10px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: isMobile ? "44px" : "48px",
            height: isMobile ? "44px" : "48px",
            background: "white",
            border: "none",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobile ? "20px" : "24px",
          }}
          title={isOpen ? "Cerrar panel" : "Abrir panel"}
        >
          {isOpen ? "✕" : "☰"}
        </button>

        {!isOpen && (
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              width: "48px",
              height: "48px",
              background: "white",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "#1a73e8",
            }}
            title="Ayuda"
          >
            ?
          </button>
        )}
      </div>

      {isOpen && (
        <>
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
          <div
            style={{
              position: "absolute",
              top: isMobile ? "10px" : "10px",
              right: isMobile ? "10px" : "10px",
              left: isMobile ? "10px" : "auto",
              width: isMobile ? "calc(100% - 20px)" : "320px",
              maxHeight: isMobile ? "85vh" : "90vh",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              zIndex: 1000,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
          <div
            style={{
              padding: "20px",
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
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#202124" }}>
              Controles
            </h2>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setShowHelp(!showHelp)}
                style={{
                  width: "36px",
                  height: "36px",
                  background: showHelp ? "#1a73e8" : "#f8f9fa",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  color: showHelp ? "white" : "#1a73e8",
                  fontWeight: "bold",
                }}
                title="Mostrar ayuda"
              >
                ?
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: "36px",
                  height: "36px",
                  background: "#f8f9fa",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "#5F6368",
                  transition: "background 0.2s",
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
          </div>

          <div style={{ padding: "20px" }}>
            {showHelp ? (
              <div>
                <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "16px", fontWeight: "600", color: "#202124" }}>
                  Explicación de Indicadores
                </h3>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ea4335", marginRight: "12px" }} />
                    <strong style={{ fontSize: "14px", color: "#202124" }}>Focos</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666", marginLeft: "36px", lineHeight: "1.5" }}>
                    Muestra cada detección individual de incendio como un punto rojo. Útil para ver la ubicación exacta de cada foco detectado por los satélites.
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ width: "24px", height: "24px", background: "linear-gradient(135deg, #ff9800 0%, #ff5722 100%)", borderRadius: "4px", marginRight: "12px" }} />
                    <strong style={{ fontSize: "14px", color: "#202124" }}>Mapa de Calor (Heatmap)</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666", marginLeft: "36px", lineHeight: "1.5" }}>
                    Visualiza la densidad e intensidad de los focos de incendio usando colores cálidos. Las áreas más rojas indican mayor concentración e intensidad de fuego.
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ff9800", marginRight: "12px" }} />
                    <strong style={{ fontSize: "14px", color: "#202124" }}>Eventos (Clusters)</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666", marginLeft: "36px", lineHeight: "1.5" }}>
                    Agrupa focos cercanos en eventos de incendio. Cada círculo representa un evento con su centro aproximado. El tamaño indica la cantidad de detecciones. El color indica la tendencia:
                  </p>
                  <ul style={{ margin: "8px 0 0 36px", padding: 0, fontSize: "13px", color: "#666", lineHeight: "1.8" }}>
                    <li><span style={{ color: "#d32f2f", fontWeight: "600" }}>Rojo ↑</span> Creciente</li>
                    <li><span style={{ color: "#388e3c", fontWeight: "600" }}>Verde ↓</span> Decreciente</li>
                    <li><span style={{ color: "#ff9800", fontWeight: "600" }}>Naranja →</span> Estable</li>
                    <li><span style={{ color: "#757575", fontWeight: "600" }}>Gris ○</span> Extinto</li>
                  </ul>
                </div>

                <div style={{ marginTop: "24px", padding: "12px", background: "#e3f2fd", borderRadius: "8px" }}>
                  <strong style={{ fontSize: "13px", color: "#1976d2" }}>FRP (Fire Radiative Power)</strong>
                  <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666", lineHeight: "1.5" }}>
                    Mide la intensidad del fuego en megavatios. Valores más altos indican incendios más intensos y peligrosos. La tendencia se calcula comparando el FRP de las últimas 24h con el período anterior (24h-48h).
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "14px", fontWeight: "600", color: "#5F6368", textTransform: "uppercase" }}>
                    Indicadores
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        background: showPoints ? "#e3f2fd" : "#f8f9fa",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: showPoints ? "2px solid #1a73e8" : "2px solid transparent",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!showPoints) {
                          e.currentTarget.style.background = "#f1f3f4";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!showPoints) {
                          e.currentTarget.style.background = "#f8f9fa";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={showPoints}
                        onChange={(e) => onPointsToggle(e.target.checked)}
                        style={{ marginRight: "12px", width: "20px", height: "20px", cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ea4335", marginRight: "12px" }} />
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#202124" }}>Focos</span>
                      </div>
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        background: showHeatmap ? "#e3f2fd" : "#f8f9fa",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: showHeatmap ? "2px solid #1a73e8" : "2px solid transparent",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!showHeatmap) {
                          e.currentTarget.style.background = "#f1f3f4";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!showHeatmap) {
                          e.currentTarget.style.background = "#f8f9fa";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={showHeatmap}
                        onChange={(e) => onHeatmapToggle(e.target.checked)}
                        style={{ marginRight: "12px", width: "20px", height: "20px", cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <div style={{ width: "20px", height: "20px", background: "linear-gradient(135deg, #ff9800 0%, #ff5722 100%)", borderRadius: "4px", marginRight: "12px" }} />
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#202124" }}>Mapa de Calor</span>
                      </div>
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        background: showEvents ? "#e3f2fd" : "#f8f9fa",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: showEvents ? "2px solid #1a73e8" : "2px solid transparent",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!showEvents) {
                          e.currentTarget.style.background = "#f1f3f4";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!showEvents) {
                          e.currentTarget.style.background = "#f8f9fa";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={showEvents}
                        onChange={(e) => onEventsToggle(e.target.checked)}
                        style={{ marginRight: "12px", width: "20px", height: "20px", cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ff9800", marginRight: "12px" }} />
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#202124" }}>Eventos</span>
                      </div>
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        background: showWeather ? "#e3f2fd" : "#f8f9fa",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: showWeather ? "2px solid #1a73e8" : "2px solid transparent",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!showWeather) {
                          e.currentTarget.style.background = "#f1f3f4";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!showWeather) {
                          e.currentTarget.style.background = "#f8f9fa";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={showWeather}
                        onChange={(e) => onWeatherToggle(e.target.checked)}
                        style={{ marginRight: "12px", width: "20px", height: "20px", cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#2196f3", marginRight: "12px" }} />
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#202124" }}>Datos Meteorológicos</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #e8eaed", paddingTop: "20px" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "14px", fontWeight: "600", color: "#5F6368", textTransform: "uppercase" }}>
                    Tipo de Mapa
                  </h3>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={toggleBaseLayer}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: currentBaseLayer === "map" ? "#1a73e8" : "#f8f9fa",
                        color: currentBaseLayer === "map" ? "white" : "#202124",
                        border: "2px solid",
                        borderColor: currentBaseLayer === "map" ? "#1a73e8" : "#e8eaed",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                      }}
                    >
                      {currentBaseLayer === "map" ? "Predeterminado" : "Satélite"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        </>
      )}

      {showHelp && !isOpen && (
        <>
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
            onClick={() => setShowHelp(false)}
          />
          <div
            style={{
              position: "absolute",
              top: isMobile ? "60px" : "70px",
              right: isMobile ? "10px" : "10px",
              left: isMobile ? "10px" : "auto",
              width: isMobile ? "calc(100% - 20px)" : "320px",
              maxHeight: isMobile ? "75vh" : "80vh",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              zIndex: 1000,
              overflowY: "auto",
              padding: isMobile ? "16px" : "20px",
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#202124" }}>
              Ayuda
            </h3>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
                color: "#5F6368",
                padding: "4px",
              }}
            >
              ✕
            </button>
          </div>

          <div>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ea4335", marginRight: "12px" }} />
                <strong style={{ fontSize: "14px", color: "#202124" }}>Focos</strong>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#666", marginLeft: "36px", lineHeight: "1.5" }}>
                Muestra cada detección individual de incendio como un punto rojo. Útil para ver la ubicación exacta de cada foco detectado por los satélites.
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ width: "24px", height: "24px", background: "linear-gradient(135deg, #ff9800 0%, #ff5722 100%)", borderRadius: "4px", marginRight: "12px" }} />
                <strong style={{ fontSize: "14px", color: "#202124" }}>Mapa de Calor (Heatmap)</strong>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#666", marginLeft: "36px", lineHeight: "1.5" }}>
                Visualiza la densidad e intensidad de los focos de incendio usando colores cálidos. Las áreas más rojas indican mayor concentración e intensidad de fuego.
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ff9800", marginRight: "12px" }} />
                <strong style={{ fontSize: "14px", color: "#202124" }}>Eventos (Clusters)</strong>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#666", marginLeft: "36px", lineHeight: "1.5" }}>
                Agrupa focos cercanos en eventos de incendio. Cada círculo representa un evento con su centro aproximado. El tamaño indica la cantidad de detecciones. El color indica la tendencia:
              </p>
              <ul style={{ margin: "8px 0 0 36px", padding: 0, fontSize: "13px", color: "#666", lineHeight: "1.8" }}>
                <li><span style={{ color: "#d32f2f", fontWeight: "600" }}>Rojo ↑</span> Creciente</li>
                <li><span style={{ color: "#388e3c", fontWeight: "600" }}>Verde ↓</span> Decreciente</li>
                    <li><span style={{ color: "#ff9800", fontWeight: "600" }}>Naranja →</span> Estable</li>
                    <li><span style={{ color: "#757575", fontWeight: "600" }}>Gris ○</span> Extinto</li>
                  </ul>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2196f3", marginRight: "12px" }} />
                <strong style={{ fontSize: "14px", color: "#202124" }}>Datos Meteorológicos</strong>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#666", marginLeft: "36px", lineHeight: "1.5" }}>
                Muestra datos meteorológicos actuales: viento (flechas azules indican dirección y velocidad), temperatura (círculos de color), humedad y presión. Los datos se actualizan cada 10 minutos.
              </p>
            </div>

            <div style={{ marginTop: "24px", padding: "12px", background: "#e3f2fd", borderRadius: "8px" }}>
              <strong style={{ fontSize: "13px", color: "#1976d2" }}>FRP (Fire Radiative Power)</strong>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666", lineHeight: "1.5" }}>
                Mide la intensidad del fuego en megavatios. Valores más altos indican incendios más intensos y peligrosos. La tendencia se calcula comparando el FRP de las últimas 24h con el período anterior (24h-48h).
              </p>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
}
