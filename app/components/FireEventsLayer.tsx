"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { buildEvents, FireEvent } from "../lib/clustering";
import { findNearestPlace } from "../lib/places";
import { TimeRange } from "./MapControls";
import { toArgentinaTimeString, timeAgo, filterByTimeRange } from "../lib/time";
import { analyzeTrends } from "../lib/trendAnalysis";
import { useFireData } from "./FireDataContext";

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

export default function FireEventsLayer({ visible, timeRange: _timeRange, onEventsChange }: FireEventsLayerProps) {
  const { data } = useFireData();

  const events = useMemo(() => {
    const filtered48h = filterByTimeRange(data.features, "48h");
    const eventsList = buildEvents(filtered48h);
    
    const eventsWithTrends = analyzeTrends(eventsList, data.features);
    
    const eventsWithNames = eventsWithTrends.map((event) => {
      const [lat, lon] = event.centroid;
      const placeName = findNearestPlace(lat, lon, 50);
      return { ...event, placeName };
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
  }, [data]);

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
              <br />
              <br />
              <strong>Detecciones (48h):</strong> {event.count}
              {event.count24h !== undefined && event.historicalCount !== undefined && (
                <>
                  <br />
                  <strong>Detecciones últimas 24h:</strong> {event.count24h}
                  <br />
                  <strong>Detecciones (24h-48h):</strong> {event.historicalCount}
                </>
              )}
              {event.frp24h !== undefined && event.frp24h_48h !== undefined && (
                <>
                  <br />
                  <br />
                  <strong>FRP últimas 24h:</strong> {event.frp24h.toFixed(1)}
                  <br />
                  <strong>FRP (24h-48h):</strong> {event.frp24h_48h.toFixed(1)}
                </>
              )}
              <br />
              <strong>FRP total:</strong> {event.frpSum.toFixed(1)}
              <br />
              <strong>FRP promedio:</strong> {event.frpAvg.toFixed(1)}
              <br />
              <strong>Última detección:</strong> {toArgentinaTimeString(new Date(event.lastSeenUtcMs))} (UTC-3)
              <br />
              <strong>Hace:</strong> {timeAgo(new Date(event.lastSeenUtcMs))}
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
