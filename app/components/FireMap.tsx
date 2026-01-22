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
import TimeSlider from "./TimeSlider";
import { FireDataProvider } from "./FireDataContext";
import { WeatherDataProvider } from "./WeatherDataContext";
import { FireEvent } from "../lib/clustering";
import WeatherIndicators from "./WeatherIndicators";

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


export default function FireMap() {
  const [showPoints, setShowPoints] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [events, setEvents] = useState<FireEvent[]>([]);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const windowHours = 3;
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
        <div style={{ height: viewportHeight, width: "100%", position: "relative", overflow: "hidden" }}>
          <MapContainer
            center={[-42.5465, -71.5091]}
            zoom={8}
            style={{ height: "100%", width: "100%" }}
          >
            <MapBounds />
            <FireEventsSidebar events={events} />
            <ControlPanel
              showPoints={showPoints}
              showHeatmap={showHeatmap}
              showEvents={showEvents}
              onPointsToggle={setShowPoints}
              onHeatmapToggle={setShowHeatmap}
              onEventsToggle={setShowEvents}
            />
            <FirePointsLayer visible={showPoints} selectedTime={selectedTime} windowHours={windowHours} />
            <FireHeatLayer visible={showHeatmap} selectedTime={selectedTime} windowHours={windowHours} />
            <FireEventsLayer visible={showEvents} selectedTime={selectedTime} windowHours={windowHours} onEventsChange={setEvents} />
          </MapContainer>
          <TimeSlider 
            selectedTime={selectedTime} 
            onTimeChange={setSelectedTime} 
            windowHours={windowHours}
            maxTimeRangeHours={120} 
          />
          <WeatherIndicators />
        </div>
      </WeatherDataProvider>
    </FireDataProvider>
  );
}
