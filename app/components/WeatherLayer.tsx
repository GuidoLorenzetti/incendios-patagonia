"use client";

import { useEffect, useMemo, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useWeatherData } from "./WeatherDataContext";
import { interpolateValue, generateGrid } from "../lib/weatherInterpolation";

interface WeatherLayerProps {
  visible: boolean;
}

export default function WeatherLayer({ visible }: WeatherLayerProps) {
  const { data } = useWeatherData();
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);

  const precipitationLayer = useMemo(() => {
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
        map.removeLayer(precipitationLayer);
      }
      return;
    }

    map.addLayer(precipitationLayer);

    return () => {
      map.removeLayer(precipitationLayer);
    };
  }, [visible, isMapReady, map, precipitationLayer]);

  useEffect(() => {
    if (!visible || data.length === 0 || !isMapReady) {
      precipitationLayer.clearLayers();
      return;
    }

    const bounds = map.getBounds();
    const grid = generateGrid(
      {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
      60
    );

    const precipitationValues = grid.map((point) => ({
      ...point,
      value: interpolateValue(data, point.lat, point.lon, "precipitation"),
    }));

    const precipitationMax = Math.max(...precipitationValues.map((v) => v.value), 0.1);

    precipitationLayer.clearLayers();

    const createPrecipitationHeatmap = (
      values: Array<{ lat: number; lon: number; value: number }>,
      max: number
    ) => {
      const points: [number, number, number][] = values
        .filter((v) => v.value > 0)
        .map((v) => {
          const normalized = Math.min(v.value / max, 1);
          return [v.lat, v.lon, normalized * 100];
        });

      if (points.length === 0) return null;

      try {
        require("leaflet.heat");
        const heatLayerFn = (L as { heatLayer?: any }).heatLayer;
        if (heatLayerFn) {
          const gradient: Record<number, string> = {
            0.0: "rgba(33, 150, 243, 0)",
            0.2: "rgba(33, 150, 243, 0.3)",
            0.4: "rgba(66, 165, 245, 0.5)",
            0.6: "rgba(100, 181, 246, 0.7)",
            0.8: "rgba(144, 202, 249, 0.85)",
            1.0: "rgba(187, 222, 251, 1)",
          };

          return heatLayerFn(points, {
            radius: 30,
            blur: 25,
            maxZoom: 18,
            minOpacity: 0.4,
            gradient,
          });
        }
      } catch {
        return null;
      }
      return null;
    };

    const precipitationHeatmap = createPrecipitationHeatmap(
      precipitationValues,
      precipitationMax
    );

    if (precipitationHeatmap) {
      precipitationLayer.addLayer(precipitationHeatmap);
    }
  }, [data, visible, isMapReady, map, precipitationLayer]);

  return null;
}
