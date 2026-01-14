"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

interface WeatherPoint {
  lat: number;
  lon: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  windDir: number;
  pressure: number;
  timestamp: string;
}

interface WeatherDataContextType {
  data: WeatherPoint[];
  loading: boolean;
  lastUpdate: Date | null;
  refresh: (bounds?: { north: number; south: number; east: number; west: number }) => Promise<void>;
}

const WeatherDataContext = createContext<WeatherDataContextType>({
  data: [],
  loading: true,
  lastUpdate: null,
  refresh: async () => {},
});

export function WeatherDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WeatherPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async (bounds?: { north: number; south: number; east: number; west: number }) => {
    try {
      const mapBounds = bounds || {
        west: -71.9,
        south: -43.4,
        east: -70.5,
        north: -42.0,
      };

      const response = await fetch(
        `/api/weather?west=${mapBounds.west}&south=${mapBounds.south}&east=${mapBounds.east}&north=${mapBounds.north}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al cargar datos meteorológicos");
      }
      const jsonData: { points: WeatherPoint[]; error?: string } = await response.json();
      if (jsonData.error) {
        setData([]);
      } else {
        setData(jsonData.points || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    }, 600000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData]);

  return (
    <WeatherDataContext.Provider value={{ data, loading, lastUpdate, refresh: fetchData }}>
      {children}
    </WeatherDataContext.Provider>
  );
}

export function useWeatherData() {
  return useContext(WeatherDataContext);
}
