"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

interface WeatherPoint {
  lat: number;
  lon: number;
  windSpeed: number;
  windDir: number;
  precipitation: number;
  timestamp: string;
}

interface WeatherDataContextType {
  data: WeatherPoint[];
  loading: boolean;
  lastUpdate: Date | null;
}

const WeatherDataContext = createContext<WeatherDataContextType>({
  data: [],
  loading: true,
  lastUpdate: null,
});

export function WeatherDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WeatherPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async (bounds?: { north: number; south: number; east: number; west: number }) => {
    try {
      const mapBounds = bounds || {
        west: -72.08705644882193,
        south: -43.30965832411127,
        east: -70.93122786797457,
        north: -41.78337582518408,
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
  }, [fetchData]);

  return (
    <WeatherDataContext.Provider value={{ data, loading, lastUpdate }}>
      {children}
    </WeatherDataContext.Provider>
  );
}

export function useWeatherData() {
  return useContext(WeatherDataContext);
}
