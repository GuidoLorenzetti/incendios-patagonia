"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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
    source?: string;
    [key: string]: string | undefined;
  };
}

interface FireGeoJSON {
  type: "FeatureCollection";
  features: FireFeature[];
}

interface FireDataContextType {
  data: FireGeoJSON;
  loading: boolean;
  lastUpdate: Date | null;
}

const FireDataContext = createContext<FireDataContextType>({
  data: { type: "FeatureCollection", features: [] },
  loading: true,
  lastUpdate: null,
});

export function FireDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FireGeoJSON>({ type: "FeatureCollection", features: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/firms/points?days=5");
        if (!response.ok) throw new Error("Error al cargar datos");
        const jsonData: FireGeoJSON = await response.json();
        setData(jsonData);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error fetching fire data:", error);
        setData({ type: "FeatureCollection", features: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <FireDataContext.Provider value={{ data, loading, lastUpdate }}>
      {children}
    </FireDataContext.Provider>
  );
}

export function useFireData() {
  return useContext(FireDataContext);
}
