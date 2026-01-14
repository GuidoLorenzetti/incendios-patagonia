"use client";

import { useEffect, useMemo, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useWeatherData } from "./WeatherDataContext";

interface WeatherLayerProps {
  visible: boolean;
}

export default function WeatherLayer({ visible }: WeatherLayerProps) {
  const { data, refresh } = useWeatherData();
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);

  const windLayer = useMemo(() => {
    return L.layerGroup();
  }, []);

  const tempLayer = useMemo(() => {
    return L.layerGroup();
  }, []);

  useEffect(() => {
    const checkMapReady = () => {
      if (map && map.getBounds().isValid()) {
        setIsMapReady(true);
      }
    };

    if (map) {
      map.whenReady(checkMapReady);
    }
  }, [map]);

  useEffect(() => {
    if (!visible || !isMapReady) {
      if (!visible) {
        map.removeLayer(windLayer);
        map.removeLayer(tempLayer);
      }
      return;
    }

    let debounceTimer: NodeJS.Timeout | null = null;

    const updateWeatherData = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        try {
          const bounds = map.getBounds();
          if (bounds.isValid()) {
            refresh({
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
            });
          }
        } catch (error) {
          refresh();
        }
      }, 1000);
    };

    const handleMoveEnd = () => updateWeatherData();
    const handleZoomEnd = () => updateWeatherData();

    updateWeatherData();

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);

    map.addLayer(windLayer);
    map.addLayer(tempLayer);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleZoomEnd);
      map.removeLayer(windLayer);
      map.removeLayer(tempLayer);
    };
  }, [visible, isMapReady, map, refresh, windLayer, tempLayer]);

  useEffect(() => {
    if (!visible || data.length === 0) {
      windLayer.clearLayers();
      tempLayer.clearLayers();
      return;
    }

    windLayer.clearLayers();
    tempLayer.clearLayers();

    data.forEach((point, idx) => {
      const arrowLength = Math.min(point.windSpeed * 4, 40);
      const arrowWidth = Math.max(arrowLength * 0.15, 4);
      const rotation = point.windDir - 90;
      const uniqueId = `arrow-${idx}-${Date.now()}`;

      const windIcon = L.divIcon({
        className: "wind-arrow",
        html: `
          <svg width="50" height="50" style="transform: rotate(${rotation}deg);">
            <defs>
              <marker id="${uniqueId}" markerWidth="10" markerHeight="10" 
                      refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="rgba(33, 150, 243, 0.8)" />
              </marker>
            </defs>
            <line x1="25" y1="25" x2="${25 + arrowLength}" y2="25" 
                  stroke="rgba(33, 150, 243, 0.8)" stroke-width="${arrowWidth}" 
                  marker-end="url(#${uniqueId})" />
          </svg>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
      });

      const windMarker = L.marker([point.lat, point.lon], { icon: windIcon });
      windMarker.bindPopup(`
        <div style="min-width: 150px">
          <strong>Datos Meteorológicos</strong><br/>
          <strong>Viento:</strong> ${point.windSpeed.toFixed(1)} m/s, ${point.windDir.toFixed(0)}°<br/>
          <strong>Temperatura:</strong> ${point.temp.toFixed(1)}°C<br/>
          <strong>Humedad:</strong> ${point.humidity}%<br/>
          <strong>Presión:</strong> ${point.pressure} hPa
        </div>
      `);
      windLayer.addLayer(windMarker);

      const tempColor = point.temp > 25 ? "#ff5722" : point.temp > 15 ? "#ff9800" : "#2196f3";
      const tempCircle = L.circleMarker([point.lat, point.lon], {
        radius: 6,
        fillColor: tempColor,
        color: "#fff",
        weight: 2,
        fillOpacity: 0.6,
      });
      tempCircle.bindPopup(`
        <div style="min-width: 150px">
          <strong>Temperatura:</strong> ${point.temp.toFixed(1)}°C<br/>
          <strong>Humedad:</strong> ${point.humidity}%<br/>
          <strong>Presión:</strong> ${point.pressure} hPa<br/>
          <strong>Viento:</strong> ${point.windSpeed.toFixed(1)} m/s, ${point.windDir.toFixed(0)}°
        </div>
      `);
      tempLayer.addLayer(tempCircle);
    });
  }, [data, visible, windLayer, tempLayer]);

  return null;
}
