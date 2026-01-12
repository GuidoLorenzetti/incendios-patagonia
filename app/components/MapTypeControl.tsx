"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function MapTypeControl() {
  const map = useMap();

  useEffect(() => {
    const control = new L.Control({ position: "topright" });

    control.onAdd = function () {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.style.background = "white";
      div.style.borderRadius = "4px";
      div.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)";
      div.style.overflow = "hidden";

      const mapButton = L.DomUtil.create("a", "leaflet-control-layers-base");
      mapButton.href = "#";
      mapButton.style.display = "flex";
      mapButton.style.alignItems = "center";
      mapButton.style.gap = "8px";
      mapButton.style.padding = "6px 12px";
      mapButton.style.textDecoration = "none";
      mapButton.style.color = "#333";
      mapButton.style.borderBottom = "1px solid #ccc";
      mapButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>Mapa</span>
      `;

      const satButton = L.DomUtil.create("a", "leaflet-control-layers-base");
      satButton.href = "#";
      satButton.style.display = "flex";
      satButton.style.alignItems = "center";
      satButton.style.gap = "8px";
      satButton.style.padding = "6px 12px";
      satButton.style.textDecoration = "none";
      satButton.style.color = "#333";
      satButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"></rect>
          <path d="M8 21h8"></path>
          <path d="M12 17v4"></path>
          <path d="M7 8l5-3 5 3"></path>
        </svg>
        <span>Satelital</span>
      `;

      let currentLayer: L.TileLayer | null = null;
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
      currentLayer = osmLayer;

      const selectLayer = (layer: L.TileLayer, button: HTMLElement) => {
        if (currentLayer) {
          map.removeLayer(currentLayer);
        }
        layer.addTo(map);
        currentLayer = layer;

        Array.from(div.children).forEach((child) => {
          (child as HTMLElement).style.background = "";
          (child as HTMLElement).style.fontWeight = "normal";
        });
        button.style.background = "#e3f2fd";
        button.style.fontWeight = "bold";
      };

      L.DomEvent.on(mapButton, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        selectLayer(osmLayer, mapButton);
      });

      L.DomEvent.on(satButton, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        selectLayer(satLayer, satButton);
      });

      mapButton.style.background = "#e3f2fd";
      mapButton.style.fontWeight = "bold";

      div.appendChild(mapButton);
      div.appendChild(satButton);

      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);

      return div;
    };

    control.addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [map]);

  return null;
}
