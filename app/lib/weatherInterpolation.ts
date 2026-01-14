interface WeatherPoint {
  lat: number;
  lon: number;
  windSpeed: number;
  windDir: number;
  precipitation: number;
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

export function interpolateValue(
  points: WeatherPoint[],
  targetLat: number,
  targetLon: number,
  field: keyof WeatherPoint,
  power: number = 2
): number {
  if (points.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const point of points) {
    const dist = distance(targetLat, targetLon, point.lat, point.lon);
    if (dist < 0.001) {
      return point[field] as number;
    }
    const weight = 1 / Math.pow(dist, power);
    totalWeight += weight;
    weightedSum += weight * (point[field] as number);
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function interpolateWind(
  points: WeatherPoint[],
  targetLat: number,
  targetLon: number
): { speed: number; dir: number; u: number; v: number } {
  if (points.length === 0) return { speed: 0, dir: 0, u: 0, v: 0 };

  let totalWeight = 0;
  let weightedU = 0;
  let weightedV = 0;

  for (const point of points) {
    const dist = distance(targetLat, targetLon, point.lat, point.lon);
    if (dist < 0.001) {
      const dirRad = (point.windDir * Math.PI) / 180;
      return {
        speed: point.windSpeed,
        dir: point.windDir,
        u: point.windSpeed * Math.sin(dirRad),
        v: point.windSpeed * Math.cos(dirRad),
      };
    }
    const weight = 1 / Math.pow(dist, 2);
    const dirRad = (point.windDir * Math.PI) / 180;
    const u = point.windSpeed * Math.sin(dirRad);
    const v = point.windSpeed * Math.cos(dirRad);
    totalWeight += weight;
    weightedU += weight * u;
    weightedV += weight * v;
  }

  if (totalWeight === 0) return { speed: 0, dir: 0, u: 0, v: 0 };

  const u = weightedU / totalWeight;
  const v = weightedV / totalWeight;
  const speed = Math.sqrt(u * u + v * v);
  const dir = (Math.atan2(u, v) * 180) / Math.PI;

  return { speed, dir, u, v };
}

export function generateGrid(
  bounds: { north: number; south: number; east: number; west: number },
  resolution: number = 50
): Array<{ lat: number; lon: number }> {
  const grid: Array<{ lat: number; lon: number }> = [];
  const latStep = (bounds.north - bounds.south) / resolution;
  const lonStep = (bounds.east - bounds.west) / resolution;

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      grid.push({
        lat: bounds.south + i * latStep,
        lon: bounds.west + j * lonStep,
      });
    }
  }

  return grid;
}
