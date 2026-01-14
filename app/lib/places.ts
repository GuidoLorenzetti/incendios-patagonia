export interface Place {
  name: string;
  lat: number;
  lon: number;
}

export const KNOWN_PLACES: Place[] = [
  { name: "Esquel", lat: -42.9110, lon: -71.3186 },
  { name: "Epuyén", lat: -42.2242, lon: -71.3681 },
  { name: "El Hoyo", lat: -42.0669, lon: -71.5164 },
  { name: "Lago Puelo", lat: -42.0846, lon: -71.6142 },
  { name: "Cholila", lat: -42.5144, lon: -71.4326 },
  { name: "Trevelin", lat: -43.0843, lon: -71.4648 },
  { name: "Corcovado", lat: -43.5392, lon: -71.4693 },
  { name: "Futaleufú", lat: -43.1816, lon: -71.8634 },

  { name: "Lago Futalaufquen", lat: -42.8451, lon: -71.6972 },
  { name: "Lago Epuyén", lat: -42.2263, lon: -71.3817 },
  { name: "Lago Verde", lat: -42.7205, lon: -71.5052 },

  { name: "Cerro La Torta", lat: -42.6408, lon: -71.5241 },
  { name: "Cerro Cónico", lat: -42.7236, lon: -71.5898 },

  { name: "Parque Nacional Los Alerces", lat: -42.8409, lon: -71.7011 },

  { name: "Reserva Provincial Río Epuyén", lat: -42.2354, lon: -71.3959 },

  { name: "Cordón Esquel", lat: -42.9305, lon: -71.3304 },
  { name: "Valle 16 de Octubre", lat: -43.0951, lon: -71.4702 },

  { name: "Río Corcovado", lat: -43.5486, lon: -71.4821 },
  { name: "Río Futaleufú", lat: -43.2008, lon: -71.9054 },
  { name: "Río Carrenleufú", lat: -42.8253, lon: -71.7206 },

  { name: "Lago Rivadavia", lat: -42.5956, lon: -71.5738 },
  { name: "Lago Menéndez", lat: -42.7584, lon: -71.6639 },
  { name: "Lago Amutuy Quimey", lat: -42.7889, lon: -71.7061 },

  { name: "Villa Futalaufquen", lat: -42.8459, lon: -71.6948 },
  { name: "Aldea Escolar", lat: -42.9274, lon: -71.3127 },

  { name: "Villa Lago Rivadavia", lat: -42.6062, lon: -71.5851 },

  { name: "Cascada Nant y Fall", lat: -43.0672, lon: -71.4936 },

  { name: "Paso Internacional Futaleufú", lat: -43.2514, lon: -71.8718 },

  { name: "Cerro Torrecillas", lat: -42.7391, lon: -71.6013 },
  { name: "Cerro Dedal", lat: -42.6497, lon: -71.5336 },
  { name: "Cerro Alto", lat: -42.7702, lon: -71.6675 },

  { name: "Río Arrayanes", lat: -42.0942, lon: -71.6249 },
  { name: "Río Azul", lat: -42.2106, lon: -71.4024 },
  { name: "Río Puelo", lat: -42.0678, lon: -71.6029 },
  { name: "Río Chubut", lat: -42.5403, lon: -71.4408 },
  { name: "Río Percey", lat: -42.6764, lon: -71.5487 },
  { name: "Río Frey", lat: -42.7341, lon: -71.5142 },
  { name: "Río Rivadavia", lat: -42.6088, lon: -71.5902 },
  { name: "Río Stange", lat: -42.7793, lon: -71.6764 },
  { name: "Río Desaguadero", lat: -42.7649, lon: -71.6522 },

  { name: "Cordón del Medio", lat: -42.6618, lon: -71.5473 },
  { name: "Cordón Rivadavia", lat: -42.6157, lon: -71.6016 },
  { name: "Cordón Situación", lat: -42.7429, lon: -71.6118 },

  { name: "Valle del Río Chubut", lat: -42.5517, lon: -71.4479 },
  { name: "Valle del Río Corcovado", lat: -43.5528, lon: -71.4886 },
  { name: "Valle del Río Futaleufú", lat: -43.2121, lon: -71.8973 },

  { name: "Reserva Forestal Lago Epuyén", lat: -42.2408, lon: -71.3997 },
  { name: "Reserva Natural Lago Puelo", lat: -42.0894, lon: -71.6195 },

  { name: "Paso de los Indios", lat: -42.6661, lon: -71.5559 },
  { name: "Paso del Sapo", lat: -42.8026, lon: -71.6468 },

  { name: "Estancia La Primavera", lat: -42.5286, lon: -71.4523 },
  { name: "Estancia El Trébol", lat: -42.6587, lon: -71.5419 },
  { name: "Estancia La Quinta", lat: -42.7224, lon: -71.5226 },
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
