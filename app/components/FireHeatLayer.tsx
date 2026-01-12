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

    let heatLayerFn: ((points: [number, number, number][], options?: { radius?: number; blur?: number; maxZoom?: number }) => L.Layer) | undefined;

    try {
      require("leaflet.heat");
      heatLayerFn = (L as { heatLayer?: typeof heatLayerFn }).heatLayer;
    } catch {
      return;
    }

    if (!heatLayerFn) return;

    const updateLayer = () => {
      const filtered = filterByTimeRange(data.features, timeRange);
      const points: [number, number, number][] = filtered.map((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        const frp = feature.properties.frp ? Number(feature.properties.frp) : 1;
        return [lat, lon, frp];
      });

      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      if (points.length > 0) {
        const layer = heatLayerFn(points, {
          radius: 25,
          blur: 18,
          maxZoom: 12,
        });

        layer.addTo(map);
        heatLayerRef.current = layer;
      }
    };

    updateLayer();

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, visible, timeRange, data]);

  return null;
}
