import { NextRequest } from "next/server";

export const revalidate = 300;

function csvToGeoJSON(csvText: string) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return { type: "FeatureCollection", features: [] };

  const headers = lines[0].split(",");
  const idxLat = headers.indexOf("latitude");
  const idxLon = headers.indexOf("longitude");

  if (idxLat === -1 || idxLon === -1) {
    throw new Error("CSV inesperado: no encuentro latitude/longitude");
  }

  return {
    type: "FeatureCollection",
    features: lines.slice(1).map((line) => {
      const cols = line.split(",");
      const lat = Number(cols[idxLat]);
      const lon = Number(cols[idxLon]);

      const props: Record<string, string> = {};
      headers.forEach((h, i) => (props[h] = cols[i]));

      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: props,
      };
    }),
  };
}

export async function GET(req: NextRequest) {
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) return new Response("Missing FIRMS_MAP_KEY", { status: 500 });

  const { searchParams } = new URL(req.url);

  const west = searchParams.get("west") ?? "-71.9";
  const south = searchParams.get("south") ?? "-43.4";
  const east = searchParams.get("east") ?? "-70.5";
  const north = searchParams.get("north") ?? "-42.0";

  const source = searchParams.get("source") ?? "VIIRS_SNPP_NRT";
  const dayRange = searchParams.get("days") ?? "2";

  const bbox = `${west},${south},${east},${north}`;
  const url = `https://firms2.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${bbox}/${dayRange}`;

  const r = await fetch(url, {
    next: { revalidate: 300 },
  });
  const txt = await r.text();

  if (!r.ok) return new Response(txt || `FIRMS HTTP ${r.status}`, { status: r.status });

  const geojson = csvToGeoJSON(txt);
  return Response.json(geojson);
}
