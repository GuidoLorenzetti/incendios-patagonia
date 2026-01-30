"use client";

import { useState, useEffect } from "react";
import { MapContainer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import FireHeatLayer from "./FireHeatLayer";
import FirePointsLayer from "./FirePointsLayer";
import FireEventsLayer from "./FireEventsLayer";
import FireEventsSidebar from "./FireEventsSidebar";
import ControlPanel from "./ControlPanel";
import MapControls, { TimeRange } from "./MapControls";
import { FireDataProvider, useFireData } from "./FireDataContext";
import { WeatherDataProvider } from "./WeatherDataContext";
import { FireEvent } from "../lib/clustering";
import WeatherIndicators from "./WeatherIndicators";
import { filterByPreviousPeriod, parseFirmsUtc } from "../lib/time";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapBounds() {
  const map = useMap();

  useEffect(() => {
    const bounds: [[number, number], [number, number]] = [
      [-43.30965832411127, -72.08705644882193],
      [-41.78337582518408, -70.93122786797457],
    ];
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map]);

  return null;
}

function LastDetectionCalculator({ timeRange, onLastDetectionChange }: { timeRange: TimeRange; onLastDetectionChange: (date: Date | null) => void }) {
  const { data } = useFireData();

  useEffect(() => {
    const filtered = filterByPreviousPeriod(data.features, timeRange);

    if (filtered.length > 0) {
      const timestamps = filtered
        .map((f) => {
          if (f.properties.acq_date && f.properties.acq_time) {
            return parseFirmsUtc(f.properties.acq_date, f.properties.acq_time);
          }
          return null;
        })
        .filter((d): d is Date => d !== null);
      if (timestamps.length > 0) {
        const latest = new Date(Math.max(...timestamps.map((d) => d.getTime())));
        onLastDetectionChange(latest);
      } else {
        onLastDetectionChange(null);
      }
    } else {
      onLastDetectionChange(null);
    }
  }, [data, timeRange, onLastDetectionChange]);

  return null;
}

export default function FireMap() {
  const [showPoints, setShowPoints] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [events, setEvents] = useState<FireEvent[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [lastDetection, setLastDetection] = useState<Date | null>(null);
  const [viewportHeight, setViewportHeight] = useState<string>("100vh");

  useEffect(() => {
    const updateHeight = () => {
      if (typeof window !== "undefined") {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty("--vh", `${vh}px`);
          setViewportHeight("calc(var(--vh, 1vh) * 100)");
        } else {
          setViewportHeight("100vh");
        }
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  return (
    <FireDataProvider>
      <WeatherDataProvider>
        <LastDetectionCalculator timeRange={timeRange} onLastDetectionChange={setLastDetection} />
        <div style={{ height: viewportHeight, width: "100%", position: "relative", overflow: "hidden" }}>
          <MapContainer
            center={[-42.5465, -71.5091]}
            zoom={8}
            style={{ height: "100%", width: "100%" }}
          >
            <MapBounds />
            <MapControls
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              lastDetection={lastDetection}
            />
            <FireEventsSidebar events={events} />
            <ControlPanel
              showPoints={showPoints}
              showHeatmap={showHeatmap}
              showEvents={showEvents}
              onPointsToggle={setShowPoints}
              onHeatmapToggle={setShowHeatmap}
              onEventsToggle={setShowEvents}
            />
            <FirePointsLayer visible={showPoints} timeRange={timeRange} />
            <FireHeatLayer visible={showHeatmap} timeRange={timeRange} />
            <FireEventsLayer visible={showEvents} timeRange={timeRange} onEventsChange={setEvents} />
          </MapContainer>
          <WeatherIndicators />
        </div>
      </WeatherDataProvider>
    </FireDataProvider>
  );
}
