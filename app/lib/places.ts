export interface Place {
  name: string;
  lat: number;
  lon: number;
}

export const KNOWN_PLACES: Place[] = [
  { name: "Esquel", lat: -42.9075, lon: -71.3195 },
  { name: "Epuyén", lat: -42.2167, lon: -71.3667 },
  { name: "El Hoyo", lat: -42.0667, lon: -71.5167 },
  { name: "Lago Puelo", lat: -42.0833, lon: -71.6167 },
  { name: "Cholila", lat: -42.5167, lon: -71.4333 },
  { name: "Trevelin", lat: -43.0833, lon: -71.4667 },
  { name: "Corcovado", lat: -43.5333, lon: -71.4667 },
  { name: "Futaleufú", lat: -43.1833, lon: -71.8667 },
  { name: "Lago Futalaufquen", lat: -42.8333, lon: -71.6833 },
  { name: "Lago Epuyén", lat: -42.2167, lon: -71.3667 },
  { name: "Lago Verde", lat: -42.7167, lon: -71.5167 },
  { name: "Cerro La Torta", lat: -42.6333, lon: -71.5167 },
  { name: "Cerro Cónico", lat: -42.7167, lon: -71.5833 },
  { name: "Parque Nacional Los Alerces", lat: -42.8333, lon: -71.6833 },
  { name: "Reserva Provincial Río Epuyén", lat: -42.2167, lon: -71.3667 },
  { name: "Cordón Esquel", lat: -42.9167, lon: -71.3167 },
  { name: "Valle 16 de Octubre", lat: -43.0833, lon: -71.4667 },
  { name: "Río Corcovado", lat: -43.5333, lon: -71.4667 },
  { name: "Río Futaleufú", lat: -43.1833, lon: -71.8667 },
  { name: "Río Carrenleufú", lat: -42.8333, lon: -71.6833 },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export function findNearestPlace(lat: number, lon: number, maxDistanceKm: number = 50): string {
  let nearest: Place | null = null;
  let minDistance = Infinity;

  for (const place of KNOWN_PLACES) {
    const distance = haversineDistance(lat, lon, place.lat, place.lon);
    if (distance < minDistance && distance <= maxDistanceKm) {
      minDistance = distance;
      nearest = place;
    }
  }

  return nearest ? nearest.name : "Lugar desconocido";
}
