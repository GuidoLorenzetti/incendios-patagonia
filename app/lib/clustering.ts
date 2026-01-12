import { parseFirmsUtc } from "./time";

export interface FirePoint {
  lat: number;
  lon: number;
  frp: number;
  confidence?: string;
  ts: number;
}

export interface FireEvent {
  id: string;
  count: number;
  centroid: [number, number];
  frpSum: number;
  frpAvg: number;
  confidenceCounts: Record<string, number>;
  lastSeenUtcMs: number;
  placeName?: string;
  trend?: "creciente" | "decreciente" | "estable" | "extinto";
  historicalCount?: number;
  count24h?: number;
  frp24h?: number;
  frp24h_48h?: number;
}

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function dbscan(points: FirePoint[], epsMeters: number = 1500, minPts: number = 4): number[][] {
  const clusters: number[][] = [];
  const visited = new Set<number>();
  const noise = new Set<number>();

  function getNeighbors(pointIdx: number): number[] {
    const neighbors: number[] = [];
    const point = points[pointIdx];
    for (let i = 0; i < points.length; i++) {
      if (i === pointIdx) continue;
      const dist = haversineMeters(point.lat, point.lon, points[i].lat, points[i].lon);
      if (dist <= epsMeters) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }

  function expandCluster(pointIdx: number, neighbors: number[], clusterId: number) {
    clusters[clusterId] = [pointIdx];
    visited.add(pointIdx);

    for (let i = 0; i < neighbors.length; i++) {
      const neighborIdx = neighbors[i];
      if (!visited.has(neighborIdx)) {
        visited.add(neighborIdx);
        const neighborNeighbors = getNeighbors(neighborIdx);
        if (neighborNeighbors.length >= minPts) {
          neighbors.push(...neighborNeighbors);
        }
      }
      if (!clusters.some((c) => c.includes(neighborIdx))) {
        clusters[clusterId].push(neighborIdx);
      }
    }
  }

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    visited.add(i);
    const neighbors = getNeighbors(i);

    if (neighbors.length < minPts) {
      noise.add(i);
    } else {
      expandCluster(i, neighbors, clusters.length);
    }
  }

  return clusters.filter((c) => c.length >= minPts);
}

export function buildEvents(features: any[]): FireEvent[] {
  if (features.length === 0) return [];

  const points: FirePoint[] = features.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    const frp = props.frp ? Number(props.frp) : 0;
    const confidence = props.confidence || "n";
    
    let ts = 0;
    if (props.acq_date && props.acq_time) {
      const dateUtc = parseFirmsUtc(props.acq_date, props.acq_time);
      ts = dateUtc.getTime();
    }

    return { lat, lon, frp, confidence, ts };
  });

  const clusters = dbscan(points, 1500, 4);

  const events: FireEvent[] = clusters.map((cluster, idx) => {
    const clusterPoints = cluster.map((i) => points[i]);
    
    const frpSum = clusterPoints.reduce((sum, p) => sum + p.frp, 0);
    const frpAvg = frpSum / clusterPoints.length;
    
    const confidenceCounts: Record<string, number> = {};
    clusterPoints.forEach((p) => {
      confidenceCounts[p.confidence || "n"] = (confidenceCounts[p.confidence || "n"] || 0) + 1;
    });

    const lastSeenUtcMs = Math.max(...clusterPoints.map((p) => p.ts));

    let latSum = 0;
    let lonSum = 0;
    let weightSum = 0;
    clusterPoints.forEach((p) => {
      const weight = p.frp || 1;
      latSum += p.lat * weight;
      lonSum += p.lon * weight;
      weightSum += weight;
    });

    const centroid: [number, number] = [latSum / weightSum, lonSum / weightSum];

    return {
      id: `event-${idx + 1}`,
      count: clusterPoints.length,
      centroid,
      frpSum,
      frpAvg,
      confidenceCounts,
      lastSeenUtcMs,
    };
  });

  return events;
}
