import { NextRequest } from "next/server";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bounds = {
    west: parseFloat(searchParams.get("west") ?? "-71.9"),
    south: parseFloat(searchParams.get("south") ?? "-43.4"),
    east: parseFloat(searchParams.get("east") ?? "-70.5"),
    north: parseFloat(searchParams.get("north") ?? "-42.0"),
  };

  const gridSize = 3;
  const latStep = (bounds.north - bounds.south) / gridSize;
  const lonStep = (bounds.east - bounds.west) / gridSize;

  const latitudes: number[] = [];
  const longitudes: number[] = [];

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      latitudes.push(bounds.south + i * latStep);
      longitudes.push(bounds.west + j * lonStep);
    }
  }

  const latParam = latitudes.join(",");
  const lonParam = longitudes.join(",");

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latParam}&longitude=${lonParam}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 600 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `Open-Meteo API error: ${response.status}`, points: [] },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.error) {
      return Response.json(
        { error: `Open-Meteo error: ${data.reason || data.error}`, points: [] },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return Response.json({ points: [] });
    }

    const weatherPoints: WeatherPoint[] = [];

    const latArray = Array.isArray(data.latitude) ? data.latitude : [data.latitude];
    const lonArray = Array.isArray(data.longitude) ? data.longitude : [data.longitude];
    const tempArray = Array.isArray(data.current?.temperature_2m) ? data.current.temperature_2m : [data.current?.temperature_2m];
    const humidityArray = Array.isArray(data.current?.relative_humidity_2m) ? data.current.relative_humidity_2m : [data.current?.relative_humidity_2m];
    const windSpeedArray = Array.isArray(data.current?.wind_speed_10m) ? data.current.wind_speed_10m : [data.current?.wind_speed_10m];
    const windDirArray = Array.isArray(data.current?.wind_direction_10m) ? data.current.wind_direction_10m : [data.current?.wind_direction_10m];
    const pressureArray = Array.isArray(data.current?.surface_pressure) ? data.current.surface_pressure : [data.current?.surface_pressure];

    const count = Math.min(
      latArray.length,
      lonArray.length,
      tempArray.length,
      humidityArray.length,
      windSpeedArray.length,
      windDirArray.length,
      pressureArray.length
    );

    for (let i = 0; i < count; i++) {
      const lat = latArray[i];
      const lon = lonArray[i];
      const temp = tempArray[i];

      if (
        lat !== undefined &&
        lon !== undefined &&
        temp !== undefined &&
        !isNaN(lat) &&
        !isNaN(lon) &&
        !isNaN(temp) &&
        isFinite(lat) &&
        isFinite(lon) &&
        isFinite(temp)
      ) {
        weatherPoints.push({
          lat,
          lon,
          temp,
          humidity: humidityArray[i] ?? 0,
          windSpeed: windSpeedArray[i] ?? 0,
          windDir: windDirArray[i] ?? 0,
          pressure: pressureArray[i] ?? 0,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return Response.json({ points: weatherPoints });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json(
        { error: "Request timeout", points: [] },
        { status: 408 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: errorMessage, points: [] },
      { status: 500 }
    );
  }
}
