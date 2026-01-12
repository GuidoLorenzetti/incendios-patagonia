"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface UnifiedLayerControlProps {
  showPoints: boolean;
  showHeatmap: boolean;
  showEvents: boolean;
  onPointsToggle: (visible: boolean) => void;
  onHeatmapToggle: (visible: boolean) => void;
  onEventsToggle: (visible: boolean) => void;
}

export default function UnifiedLayerControl({ showPoints, showHeatmap, showEvents, onPointsToggle, onHeatmapToggle, onEventsToggle }: UnifiedLayerControlProps) {
  const map = useMap();
  const controlRef = useRef<L.Control | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const currentBaseTypeRef = useRef<"map" | "sat">("map");

  useEffect(() => {
    const control = new L.Control({ position: "topright" });
    controlRef.current = control;

    control.onAdd = function () {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.style.position = "relative";

      // Botón principal con ícono (estilo Google Maps)
      const toggleButton = L.DomUtil.create("a", "leaflet-control-layers-toggle");
      toggleButton.href = "#";
      toggleButton.style.display = "flex";
      toggleButton.style.alignItems = "center";
      toggleButton.style.justifyContent = "center";
      toggleButton.style.width = "40px";
      toggleButton.style.height = "40px";
      toggleButton.style.background = "white";
      toggleButton.style.borderRadius = "2px";
      toggleButton.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      toggleButton.style.cursor = "pointer";
      toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#5F6368" stroke="#5F6368" stroke-width="0.5"/>
          <path d="M2 17L12 22L22 17" stroke="#5F6368" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M2 12L12 17L22 12" stroke="#5F6368" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      `;

      // Menú desplegable (estilo Google Maps)
      const menu = L.DomUtil.create("div", "layer-menu");
      menu.style.display = "none";
      menu.style.position = "absolute";
      menu.style.top = "44px";
      menu.style.right = "0";
      menu.style.background = "white";
      menu.style.borderRadius = "8px";
      menu.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
      menu.style.width = "320px";
      menu.style.maxHeight = "80vh";
      menu.style.overflowY = "auto";
      menu.style.zIndex = "1000";

      // Header del menú
      const header = L.DomUtil.create("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.padding = "16px 20px";
      header.style.borderBottom = "1px solid #e8eaed";
      const headerTitle = L.DomUtil.create("div");
      headerTitle.textContent = "Detalles del mapa";
      headerTitle.style.fontSize = "16px";
      headerTitle.style.fontWeight = "500";
      headerTitle.style.color = "#202124";
      const closeButton = L.DomUtil.create("button");
      closeButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      closeButton.style.background = "none";
      closeButton.style.border = "none";
      closeButton.style.cursor = "pointer";
      closeButton.style.padding = "4px";
      closeButton.style.display = "flex";
      closeButton.style.alignItems = "center";
      closeButton.style.justifyContent = "center";
      header.appendChild(headerTitle);
      header.appendChild(closeButton);

      // Sección: Overlays (Detalles del mapa)
      const overlaysSection = L.DomUtil.create("div");
      overlaysSection.style.padding = "16px 20px";
      
      const overlaysTitle = L.DomUtil.create("div");
      overlaysTitle.textContent = "Detalles del mapa";
      overlaysTitle.style.fontSize = "14px";
      overlaysTitle.style.fontWeight = "500";
      overlaysTitle.style.color = "#5F6368";
      overlaysTitle.style.marginBottom = "12px";
      overlaysSection.appendChild(overlaysTitle);

      const overlaysGrid = L.DomUtil.create("div");
      overlaysGrid.style.display = "grid";
      overlaysGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
      overlaysGrid.style.gap = "16px";

      // Botón Focos
      const pointsButton = L.DomUtil.create("div");
      pointsButton.style.display = "flex";
      pointsButton.style.flexDirection = "column";
      pointsButton.style.alignItems = "center";
      pointsButton.style.cursor = "pointer";
      pointsButton.style.padding = "12px 8px";
      pointsButton.style.borderRadius = "8px";
      pointsButton.style.border = showPoints ? "2px solid #1a73e8" : "2px solid transparent";
      pointsButton.style.transition = "all 0.2s";
      pointsButton.innerHTML = `
        <div style="width: 48px; height: 48px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ea4335" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="4" fill="#ea4335"></circle>
          </svg>
        </div>
        <span style="font-size: 12px; color: #202124; text-align: center;">Focos</span>
      `;
      pointsButton.onmouseenter = () => { if (!showPoints) pointsButton.style.background = "#f8f9fa"; };
      pointsButton.onmouseleave = () => { if (!showPoints) pointsButton.style.background = ""; };

      // Botón Heatmap
      const heatmapButton = L.DomUtil.create("div");
      heatmapButton.style.display = "flex";
      heatmapButton.style.flexDirection = "column";
      heatmapButton.style.alignItems = "center";
      heatmapButton.style.cursor = "pointer";
      heatmapButton.style.padding = "12px 8px";
      heatmapButton.style.borderRadius = "8px";
      heatmapButton.style.border = showHeatmap ? "2px solid #1a73e8" : "2px solid transparent";
      heatmapButton.style.transition = "all 0.2s";
      heatmapButton.innerHTML = `
        <div style="width: 48px; height: 48px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" fill="#ff9800" opacity="0.3"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1" fill="#ff9800" opacity="0.6"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1" fill="#ff9800" opacity="0.6"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1" fill="#ff9800"></rect>
          </svg>
        </div>
        <span style="font-size: 12px; color: #202124; text-align: center;">Heatmap</span>
      `;
      heatmapButton.onmouseenter = () => { if (!showHeatmap) heatmapButton.style.background = "#f8f9fa"; };
      heatmapButton.onmouseleave = () => { if (!showHeatmap) heatmapButton.style.background = ""; };

      // Botón Eventos
      const eventsButton = L.DomUtil.create("div");
      eventsButton.style.display = "flex";
      eventsButton.style.flexDirection = "column";
      eventsButton.style.alignItems = "center";
      eventsButton.style.cursor = "pointer";
      eventsButton.style.padding = "12px 8px";
      eventsButton.style.borderRadius = "8px";
      eventsButton.style.border = showEvents ? "2px solid #1a73e8" : "2px solid transparent";
      eventsButton.style.transition = "all 0.2s";
      eventsButton.innerHTML = `
        <div style="width: 48px; height: 48px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6" fill="#ff9800" opacity="0.3"></circle>
            <circle cx="12" cy="12" r="2" fill="#ff9800"></circle>
          </svg>
        </div>
        <span style="font-size: 12px; color: #202124; text-align: center;">Eventos</span>
      `;
      eventsButton.onmouseenter = () => { if (!showEvents) eventsButton.style.background = "#f8f9fa"; };
      eventsButton.onmouseleave = () => { if (!showEvents) eventsButton.style.background = ""; };

      overlaysGrid.appendChild(pointsButton);
      overlaysGrid.appendChild(heatmapButton);
      overlaysGrid.appendChild(eventsButton);
      overlaysSection.appendChild(overlaysGrid);

      // Separator
      const separator1 = L.DomUtil.create("div");
      separator1.style.height = "1px";
      separator1.style.background = "#e8eaed";
      separator1.style.margin = "0";

      // Sección: Tipo de mapa
      const mapTypeSection = L.DomUtil.create("div");
      mapTypeSection.style.padding = "16px 20px";
      
      const mapTypeTitle = L.DomUtil.create("div");
      mapTypeTitle.textContent = "Tipo de mapa";
      mapTypeTitle.style.fontSize = "14px";
      mapTypeTitle.style.fontWeight = "500";
      mapTypeTitle.style.color = "#5F6368";
      mapTypeTitle.style.marginBottom = "12px";
      mapTypeSection.appendChild(mapTypeTitle);

      const mapTypeGrid = L.DomUtil.create("div");
      mapTypeGrid.style.display = "grid";
      mapTypeGrid.style.gridTemplateColumns = "repeat(2, 1fr)";
      mapTypeGrid.style.gap = "12px";

      // Botón Mapa
      const mapButton = L.DomUtil.create("div");
      mapButton.style.display = "flex";
      mapButton.style.flexDirection = "column";
      mapButton.style.alignItems = "center";
      mapButton.style.cursor = "pointer";
      mapButton.style.padding = "12px 8px";
      mapButton.style.borderRadius = "8px";
      mapButton.style.border = currentBaseTypeRef.current === "map" ? "2px solid #1a73e8" : "2px solid transparent";
      mapButton.style.transition = "all 0.2s";
      mapButton.innerHTML = `
        <div style="width: 64px; height: 48px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px; overflow: hidden;">
          <svg width="48" height="36" viewBox="0 0 24 18" fill="none">
            <rect width="24" height="18" fill="#e8f5e9"/>
            <path d="M0 12h24" stroke="#4caf50" stroke-width="1"/>
            <path d="M0 6h24" stroke="#4caf50" stroke-width="1"/>
            <circle cx="12" cy="9" r="2" fill="#4caf50"/>
          </svg>
        </div>
        <span style="font-size: 12px; color: #202124; text-align: center;">Predeterminado</span>
      `;
      mapButton.onmouseenter = () => { if (currentBaseTypeRef.current !== "map") mapButton.style.background = "#f8f9fa"; };
      mapButton.onmouseleave = () => { if (currentBaseTypeRef.current !== "map") mapButton.style.background = ""; };

      // Botón Satelital
      const satButton = L.DomUtil.create("div");
      satButton.style.display = "flex";
      satButton.style.flexDirection = "column";
      satButton.style.alignItems = "center";
      satButton.style.cursor = "pointer";
      satButton.style.padding = "12px 8px";
      satButton.style.borderRadius = "8px";
      satButton.style.border = currentBaseTypeRef.current === "sat" ? "2px solid #1a73e8" : "2px solid transparent";
      satButton.style.transition = "all 0.2s";
      satButton.innerHTML = `
        <div style="width: 64px; height: 48px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px; overflow: hidden;">
          <svg width="48" height="36" viewBox="0 0 24 18" fill="none">
            <rect width="24" height="18" fill="#8d6e63"/>
            <rect x="2" y="2" width="20" height="14" fill="#a1887f"/>
            <path d="M6 6h12M6 10h12M6 14h8" stroke="#5d4037" stroke-width="0.5"/>
          </svg>
        </div>
        <span style="font-size: 12px; color: #202124; text-align: center;">Satélite</span>
      `;
      satButton.onmouseenter = () => { if (currentBaseTypeRef.current !== "sat") satButton.style.background = "#f8f9fa"; };
      satButton.onmouseleave = () => { if (currentBaseTypeRef.current !== "sat") satButton.style.background = ""; };

      mapTypeGrid.appendChild(mapButton);
      mapTypeGrid.appendChild(satButton);
      mapTypeSection.appendChild(mapTypeGrid);

      const osmLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      );
      const satLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
        }
      );

      osmLayer.addTo(map);
      baseLayerRef.current = osmLayer;
      currentBaseTypeRef.current = "map";

      const updateBaseLayerButtons = () => {
        const type = currentBaseTypeRef.current;
        
        if (type === "map") {
          mapButton.style.border = "2px solid #1a73e8";
          satButton.style.border = "2px solid transparent";
        } else {
          satButton.style.border = "2px solid #1a73e8";
          mapButton.style.border = "2px solid transparent";
        }
      };

      const updateOverlayButtons = () => {
        pointsButton.style.border = showPoints ? "2px solid #1a73e8" : "2px solid transparent";
        heatmapButton.style.border = showHeatmap ? "2px solid #1a73e8" : "2px solid transparent";
        eventsButton.style.border = showEvents ? "2px solid #1a73e8" : "2px solid transparent";
      };

      let isOpen = false;
      let closeMenuHandler: ((e: MouseEvent) => void) | null = null;

      const closeMenu = () => {
        isOpen = false;
        menu.style.display = "none";
        if (closeMenuHandler) {
          document.removeEventListener("click", closeMenuHandler);
          closeMenuHandler = null;
        }
      };

      const toggleMenu = () => {
        isOpen = !isOpen;
        menu.style.display = isOpen ? "block" : "none";
        
        if (isOpen && !closeMenuHandler) {
          closeMenuHandler = (e: MouseEvent) => {
            if (isOpen && !div.contains(e.target as Node)) {
              closeMenu();
            }
          };
          setTimeout(() => {
            document.addEventListener("click", closeMenuHandler!);
          }, 0);
        } else if (!isOpen && closeMenuHandler) {
          document.removeEventListener("click", closeMenuHandler);
          closeMenuHandler = null;
        }
      };

      const selectBaseLayer = (layer: L.TileLayer, type: "map" | "sat") => {
        if (baseLayerRef.current) {
          map.removeLayer(baseLayerRef.current);
        }
        layer.addTo(map);
        baseLayerRef.current = layer;
        currentBaseTypeRef.current = type;
        updateBaseLayerButtons();
        closeMenu();
      };

      const togglePoints = () => {
        const newState = !showPoints;
        onPointsToggle(newState);
      };

      const toggleHeatmap = () => {
        const newState = !showHeatmap;
        onHeatmapToggle(newState);
      };

      const toggleEvents = () => {
        const newState = !showEvents;
        onEventsToggle(newState);
      };

      L.DomEvent.on(mapButton, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        selectBaseLayer(osmLayer, "map");
      });

      L.DomEvent.on(satButton, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        selectBaseLayer(satLayer, "sat");
      });

      L.DomEvent.on(pointsButton, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        togglePoints();
      });

      L.DomEvent.on(heatmapButton, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        toggleHeatmap();
      });

      L.DomEvent.on(eventsButton, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        toggleEvents();
      });

      L.DomEvent.on(closeButton, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        closeMenu();
      });

      updateBaseLayerButtons();
      updateOverlayButtons();

      menu.appendChild(header);
      menu.appendChild(overlaysSection);
      menu.appendChild(separator1);
      menu.appendChild(mapTypeSection);

      div.appendChild(toggleButton);
      div.appendChild(menu);

      L.DomEvent.on(toggleButton, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        toggleMenu();
      });

      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);

      return div;
    };

    control.addTo(map);

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }
      // Limpiar event listeners si existen
      const container = controlRef.current?.getContainer();
      if (container) {
        const menu = container.querySelector('.layer-menu') as HTMLElement;
        if (menu && menu.style.display === "block") {
          // Cerrar el menú si está abierto
          menu.style.display = "none";
        }
      }
    };
  }, [map, onPointsToggle, onHeatmapToggle, onEventsToggle]);

  useEffect(() => {
    if (!controlRef.current) return;
    const container = controlRef.current.getContainer();
    if (!container) return;

    const menu = container.querySelector('.layer-menu') as HTMLElement;
    if (!menu) return;

    const overlaysGrid = menu.querySelector('div[style*="grid-template-columns: repeat(3, 1fr)"]') as HTMLElement;
    if (overlaysGrid) {
      const pointsButton = overlaysGrid.firstElementChild as HTMLElement;
      const heatmapButton = overlaysGrid.children[1] as HTMLElement;
      const eventsButton = overlaysGrid.children[2] as HTMLElement;
      
      if (pointsButton) {
        pointsButton.style.border = showPoints ? "2px solid #1a73e8" : "2px solid transparent";
      }
      if (heatmapButton) {
        heatmapButton.style.border = showHeatmap ? "2px solid #1a73e8" : "2px solid transparent";
      }
      if (eventsButton) {
        eventsButton.style.border = showEvents ? "2px solid #1a73e8" : "2px solid transparent";
      }
    }
  }, [showPoints, showHeatmap, showEvents]);

  return null;
}
