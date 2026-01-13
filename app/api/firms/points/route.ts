import { NextRequest } from "next/server";

interface CacheEntry {
  data: { type: "FeatureCollection"; features: any[] };
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 180000;

function getCacheKey(bbox: string, sources: string[], dayRange: string): string {
  return `${bbox}|${sources.join(",")}|${dayRange}`;
}

function getCached(key: string): { type: "FeatureCollection"; features: any[] } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: { type: "FeatureCollection"; features: any[] }): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function csvToGeoJSON(csvText: string, sourceName: string): { type: "FeatureCollection"; features: any[] } {
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
      props.source = sourceName;

      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: props,
      };
    }),
  };
}

async function fetchSource(
  key: string,
  source: string,
  bbox: string,
  dayRange: string
): Promise<{ type: "FeatureCollection"; features: any[] }> {
  const url = `https://firms2.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${bbox}/${dayRange}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const r = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const txt = await r.text();

    if (!r.ok) {
      console.error(`FIRMS ${source} HTTP ${r.status}: ${txt.substring(0, 200)}`);
      return { type: "FeatureCollection", features: [] };
    }

    if (!txt || txt.trim().length === 0) {
      return { type: "FeatureCollection", features: [] };
    }

    return csvToGeoJSON(txt, source);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`FIRMS ${source} timeout`);
    } else {
      console.error(`Error fetching FIRMS ${source}:`, error.message);
    }
    return { type: "FeatureCollection", features: [] };
  }
}

export async function GET(req: NextRequest) {
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) return new Response("Missing FIRMS_MAP_KEY", { status: 500 });

  const { searchParams } = new URL(req.url);

  const west = searchParams.get("west") ?? "-71.9";
  const south = searchParams.get("south") ?? "-43.4";
  const east = searchParams.get("east") ?? "-70.5";
  const north = searchParams.get("north") ?? "-42.0";
  
  let dayRange = searchParams.get("days") ?? "2";
  const daysNum = parseInt(dayRange);
  if (isNaN(daysNum) || daysNum < 1 || daysNum > 5) {
    dayRange = "5";
  } else {
    dayRange = String(daysNum);
  }

  const sourcesParam = searchParams.get("sources");
  const sources = sourcesParam
    ? sourcesParam.split(",").map((s) => s.trim())
    : ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"];

  const bbox = `${west},${south},${east},${north}`;
  const cacheKey = getCacheKey(bbox, sources, dayRange);

  const cached = getCached(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  const results = await Promise.all(
    sources.map((source) => fetchSource(key, source, bbox, dayRange))
  );

  const allFeatures = results.flatMap((result) => result.features);

  const response: { type: "FeatureCollection"; features: any[] } = {
    type: "FeatureCollection",
    features: allFeatures,
  };

  setCache(cacheKey, response);

  return Response.json(response);
}
