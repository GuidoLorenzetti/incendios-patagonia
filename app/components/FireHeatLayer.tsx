"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { TimeRange } from "./MapControls";
import { filterByTimeRange } from "../lib/time";
import { useFireData } from "./FireDataContext";

interface FireFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    frp?: string;
    [key: string]: string | undefined;
  };
}

interface FireGeoJSON {
  type: "FeatureCollection";
  features: FireFeature[];
}

interface FireHeatLayerProps {
  visible: boolean;
  timeRange: TimeRange;
}

interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
  gradient?: Record<number, string>;
}

export default function FireHeatLayer({ visible, timeRange }: FireHeatLayerProps) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);
  const { data } = useFireData();

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (!visible) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    let heatLayerFn: ((points: [number, number, number][], options?: HeatLayerOptions) => L.Layer) | undefined;

    try {
      require("leaflet.heat");
      heatLayerFn = (L as { heatLayer?: typeof heatLayerFn }).heatLayer;
    } catch {
      return;
    }

    if (!heatLayerFn) return;

    const updateLayer = () => {
      const filtered = filterByTimeRange(data.features, timeRange);
      
      if (filtered.length === 0) {
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }
        return;
      }

      const frpValues = filtered
        .map((f) => (f.properties.frp ? Number(f.properties.frp) : 0))
        .filter((v) => v > 0);
      
      const maxFrp = frpValues.length > 0 ? Math.max(...frpValues) : 1;
      const minFrp = frpValues.length > 0 ? Math.min(...frpValues) : 0;

      const points: [number, number, number][] = filtered.map((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        const frp = feature.properties.frp ? Number(feature.properties.frp) : 0;
        const normalizedFrp = maxFrp > minFrp 
          ? ((frp - minFrp) / (maxFrp - minFrp)) * 100 + 10
          : 10;
        return [lat, lon, Math.max(1, normalizedFrp)];
      });

      const currentZoom = map.getZoom();
      
      const radius = Math.max(15, Math.min(40, 20 + (currentZoom - 9) * 3));
      const blur = Math.max(12, Math.min(25, 15 + (currentZoom - 9) * 2));

      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      const gradient: Record<number, string> = {
        0.0: "rgba(255, 255, 0, 0)",
        0.2: "rgba(255, 200, 0, 0.3)",
        0.4: "rgba(255, 150, 0, 0.5)",
        0.6: "rgba(255, 100, 0, 0.7)",
        0.8: "rgba(255, 50, 0, 0.85)",
        1.0: "rgba(255, 0, 0, 1)",
      };

      const layer = heatLayerFn(points, {
        radius,
        blur,
        maxZoom: 18,
        minOpacity: 0.2,
        gradient,
      });

      layer.addTo(map);
      heatLayerRef.current = layer;
    };

    updateLayer();

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent : ""
    );

    let updateTimeout: NodeJS.Timeout | null = null;
    let lastUpdate = 0;
    const throttleMs = isMobile ? 200 : 0;

    const handleUpdate = () => {
      if (isMobile) {
        const now = Date.now();
        if (now - lastUpdate < throttleMs) {
          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }
          updateTimeout = setTimeout(() => {
            updateLayer();
            lastUpdate = Date.now();
          }, throttleMs - (now - lastUpdate));
          return;
        }
        lastUpdate = now;
      }
      updateLayer();
    };

    const handleZoom = () => {
      handleUpdate();
    };

    const handleMove = () => {
      handleUpdate();
    };

    map.on("zoom", handleZoom);
    map.on("move", handleMove);
    map.on("zoomstart", handleZoom);
    map.on("movestart", handleMove);

    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      map.off("zoom", handleZoom);
      map.off("move", handleMove);
      map.off("zoomstart", handleZoom);
      map.off("movestart", handleMove);
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, visible, timeRange, data]);

  return null;
}
