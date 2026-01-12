import { FireEvent } from "./clustering";
import { parseFirmsUtc, getTimeRangeMs } from "./time";

export type TimeRange = "6h" | "12h" | "24h" | "48h" | "7d";

export function analyzeTrends(
  events: FireEvent[],
  allFeatures: any[],
  timeRange: TimeRange
): FireEvent[] {
  const nowUtc = new Date();
  const cutoff24h = nowUtc.getTime() - getTimeRangeMs("24h");
  const cutoff48h = nowUtc.getTime() - getTimeRangeMs("48h");

  const features24h = allFeatures.filter((f) => {
    if (!f.properties.acq_date || !f.properties.acq_time) return false;
    const dateUtc = parseFirmsUtc(f.properties.acq_date, f.properties.acq_time);
    return dateUtc.getTime() >= cutoff24h;
  });

  const features24h_48h = allFeatures.filter((f) => {
    if (!f.properties.acq_date || !f.properties.acq_time) return false;
    const dateUtc = parseFirmsUtc(f.properties.acq_date, f.properties.acq_time);
    return dateUtc.getTime() >= cutoff48h && dateUtc.getTime() < cutoff24h;
  });

  return events.map((event) => {
    const [lat, lon] = event.centroid;
    const eventRadius = 1500;

    const points24h = features24h.filter((f) => {
      const [fLon, fLat] = f.geometry.coordinates;
      const dist = haversineMeters(lat, lon, fLat, fLon);
      return dist <= eventRadius;
    });

    const points24h_48h = features24h_48h.filter((f) => {
      const [fLon, fLat] = f.geometry.coordinates;
      const dist = haversineMeters(lat, lon, fLat, fLon);
      return dist <= eventRadius;
    });

    const count24h = points24h.length;
    const count24h_48h = points24h_48h.length;

    const frp24h = points24h.reduce((sum, f) => {
      const frp = f.properties.frp ? Number(f.properties.frp) : 0;
      return sum + frp;
    }, 0);

    const frp24h_48h = points24h_48h.reduce((sum, f) => {
      const frp = f.properties.frp ? Number(f.properties.frp) : 0;
      return sum + frp;
    }, 0);

    const latestTimestamp24h = points24h.length > 0
      ? Math.max(...points24h.map((f) => {
          const dateUtc = parseFirmsUtc(f.properties.acq_date!, f.properties.acq_time!);
          return dateUtc.getTime();
        }))
      : 0;

    const lastSeenUtcMs = Math.max(event.lastSeenUtcMs, latestTimestamp24h);

    let trend: "creciente" | "decreciente" | "estable" | "extinto" = "estable";
    
    if (frp24h === 0 && count24h === 0 && (frp24h_48h > 0 || count24h_48h > 0)) {
      trend = "extinto";
    } else if (frp24h_48h > 0 && frp24h > 0) {
      const ratio = frp24h / frp24h_48h;
      if (ratio > 1.1) {
        trend = "creciente";
      } else if (ratio < 0.9) {
        trend = "decreciente";
      } else {
        trend = "estable";
      }
    } else if (frp24h > 0 && frp24h_48h === 0) {
      trend = "creciente";
    } else if (frp24h === 0 && frp24h_48h > 0) {
      trend = "decreciente";
    }

    return {
      ...event,
      trend,
      historicalCount: count24h_48h,
      count24h: count24h,
      frp24h: frp24h,
      frp24h_48h: frp24h_48h,
      lastSeenUtcMs,
    };
  });
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
