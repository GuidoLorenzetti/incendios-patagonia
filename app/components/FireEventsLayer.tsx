"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { buildEvents, FireEvent } from "../lib/clustering";
import { findNearestPlace } from "../lib/places";
import { TimeRange } from "./MapControls";
import { toArgentinaTimeString, timeAgo, filterByTimeRange } from "../lib/time";
import { analyzeTrends } from "../lib/trendAnalysis";
import { useFireData } from "./FireDataContext";
import { useWeatherData } from "./WeatherDataContext";
import { interpolateWind, interpolateValue } from "../lib/weatherInterpolation";

interface FireFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    confidence?: string;
    frp?: string;
    satellite?: string;
    acq_date?: string;
    acq_time?: string;
    [key: string]: string | undefined;
  };
}

interface FireGeoJSON {
  type: "FeatureCollection";
  features: FireFeature[];
}

interface FireEventsLayerProps {
  visible: boolean;
  timeRange: TimeRange;
  onEventsChange?: (events: FireEvent[]) => void;
}

export default function FireEventsLayer({ visible, timeRange, onEventsChange }: FireEventsLayerProps) {
  const { data } = useFireData();
  const { data: weatherData } = useWeatherData();

  const events = useMemo(() => {
    const filteredByRange = filterByTimeRange(data.features, timeRange);
    const eventsList = buildEvents(filteredByRange);
    
    const eventsWithTrends = analyzeTrends(eventsList, data.features, timeRange);
    
    const eventsWithNames = eventsWithTrends.map((event) => {
      const [lat, lon] = event.centroid;
      const placeName = findNearestPlace(lat, lon, 50);
      
      let windSpeed: number | undefined;
      let windDir: number | undefined;
      let precipitation: number | undefined;
      
      if (weatherData.length > 0) {
        const wind = interpolateWind(weatherData, lat, lon);
        windSpeed = wind.speed;
        windDir = wind.dir;
        precipitation = interpolateValue(weatherData, lat, lon, "precipitation");
      }
      
      return { ...event, placeName, windSpeed, windDir, precipitation };
    });

    const placeNameGroups: Record<string, string[]> = {};
    eventsWithNames.forEach((event) => {
      const baseName = event.placeName || "Lugar desconocido";
      if (!placeNameGroups[baseName]) {
        placeNameGroups[baseName] = [];
      }
      placeNameGroups[baseName].push(event.id);
    });

    const placeNameCounts: Record<string, number> = {};
    const eventsWithNumberedNames = eventsWithNames.map((event) => {
      const baseName = event.placeName || "Lugar desconocido";
      const group = placeNameGroups[baseName];
      
      if (group && group.length > 1) {
        if (!placeNameCounts[baseName]) {
          placeNameCounts[baseName] = 0;
        }
        placeNameCounts[baseName]++;
        return { ...event, placeName: `${baseName} #${placeNameCounts[baseName]}` };
      }
      
      return event;
    });

    return eventsWithNumberedNames;
  }, [data, timeRange, weatherData]);

  useEffect(() => {
    if (onEventsChange) {
      onEventsChange(events);
    }
  }, [events, onEventsChange]);


  const markers = useMemo(() => {
    if (!visible) return null;

    return events.map((event) => {
      const radius = Math.max(8, Math.min(20, Math.sqrt(event.count) * 2));
      const [lat, lon] = event.centroid;

      const trendColor = event.trend === "creciente" ? "#d32f2f" 
        : event.trend === "decreciente" ? "#388e3c" 
        : event.trend === "extinto" ? "#757575" 
        : "#ff9800";
      const trendIcon = event.trend === "creciente" ? "↑" 
        : event.trend === "decreciente" ? "↓" 
        : event.trend === "extinto" ? "○" 
        : "→";

      return (
        <CircleMarker
          key={event.id}
          center={[lat, lon]}
          radius={radius}
          pathOptions={{
            color: trendColor,
            fillColor: trendColor,
            fillOpacity: 0.8,
            weight: 3,
          }}
        >
          <Popup>
            <div style={{ minWidth: "200px", maxWidth: "280px", fontSize: "13px" }}>
              <strong>{event.placeName || `Incendio #${event.id.replace("event-", "")}`}</strong>
              {event.trend && (
                <span style={{ marginLeft: "8px", color: trendColor, fontWeight: "bold" }}>
                  {trendIcon} {event.trend}
                </span>
              )}
              {event.trendReason && (
                <>
                  <br />
                  <em style={{ fontSize: "11px", color: "#666", display: "block", marginTop: "4px" }}>
                    {event.trendReason}
                  </em>
                </>
              )}
              <br />
              <br />
              <strong>Resumen del evento:</strong>
              <br />
              <strong>Total de detecciones:</strong> {event.count}
              <br />
              <strong>FRP total:</strong> {event.frpSum.toFixed(1)}
              <br />
              <strong>FRP promedio:</strong> {event.frpAvg.toFixed(1)}
              <br />
              <strong>Última detección:</strong> {toArgentinaTimeString(new Date(event.lastSeenUtcMs))} (UTC-3)
              <br />
              <strong>Hace:</strong> {timeAgo(new Date(event.lastSeenUtcMs))}
              {event.count24h !== undefined && event.historicalCount !== undefined && (
                <>
                  <br />
                  <br />
                  <strong style={{ color: "#1976d2" }}>Análisis de actividad:</strong>
                  <br />
                  <strong>Total en {timeRange}:</strong> {event.historicalCount} detecciones
                  {event.frp24h_48h !== undefined && (
                    <> (FRP: {event.frp24h_48h.toFixed(1)})</>
                  )}
                  <br />
                  <strong>Últimas 6 horas:</strong> {event.count24h} detecciones
                  {event.frp24h !== undefined && (
                    <> (FRP: {event.frp24h.toFixed(1)})</>
                  )}
                </>
              )}
              {(event.windSpeed !== undefined || event.precipitation !== undefined) && (
                <>
                  <br />
                  <br />
                  <strong style={{ color: "#1976d2" }}>Condiciones Meteorológicas:</strong>
                  {event.windSpeed !== undefined && event.windDir !== undefined && (
                    <>
                      <br />
                      <strong>Viento:</strong> {event.windSpeed.toFixed(1)} m/s, {event.windDir.toFixed(0)}°
                    </>
                  )}
                  {event.precipitation !== undefined && (
                    <>
                      <br />
                      <strong>Precipitación:</strong> {event.precipitation > 0 ? `${event.precipitation.toFixed(1)} mm/h` : "Sin lluvia"}
                    </>
                  )}
                </>
              )}
              <br />
              <br />
              <em style={{ fontSize: "11px", color: "#666" }}>
                Este círculo es un marcador del evento (centro aproximado), no perímetro
              </em>
            </div>
          </Popup>
        </CircleMarker>
      );
    });
  }, [events, visible]);

  return <>{markers}</>;
}
