"use client";

import { useState } from "react";
import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import FireHeatLayer from "./FireHeatLayer";
import FirePointsLayer from "./FirePointsLayer";
import FireEventsLayer from "./FireEventsLayer";
import FireEventsSidebar from "./FireEventsSidebar";
import ControlPanel from "./ControlPanel";
import MapControls, { TimeRange } from "./MapControls";
import { FireDataProvider } from "./FireDataContext";
import { WeatherDataProvider } from "./WeatherDataContext";
import { FireEvent } from "../lib/clustering";
import WeatherLayer from "./WeatherLayer";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function FireMap() {
  const [showPoints, setShowPoints] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [events, setEvents] = useState<FireEvent[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [lastDetection, setLastDetection] = useState<Date | null>(null);

  return (
    <FireDataProvider>
      <WeatherDataProvider>
        <div style={{ height: "100vh", width: "100%", position: "relative" }}>
          <MapContainer
            center={[-42.7, -71.2]}
            zoom={9}
            style={{ height: "100%", width: "100%" }}
          >
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
              showWeather={showWeather}
              onPointsToggle={setShowPoints}
              onHeatmapToggle={setShowHeatmap}
              onEventsToggle={setShowEvents}
              onWeatherToggle={setShowWeather}
            />
            <FirePointsLayer visible={showPoints} timeRange={timeRange} onLastDetectionChange={setLastDetection} />
            <FireHeatLayer visible={showHeatmap} timeRange={timeRange} />
            <FireEventsLayer visible={showEvents} timeRange={timeRange} onEventsChange={setEvents} />
            <WeatherLayer visible={showWeather} />
          </MapContainer>
        </div>
      </WeatherDataProvider>
    </FireDataProvider>
  );
}
