import { NextRequest } from "next/server";

export const revalidate = 300;

interface WeatherPoint {
  lat: number;
  lon: number;
  windSpeed: number;
  windDir: number;
  precipitation: number;
  timestamp: string;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENWEATHER_API_KEY || "4c3820051b17220d8876becbff65990a";
  
  const { searchParams } = new URL(req.url);
  const bounds = {
    west: parseFloat(searchParams.get("west") ?? "-72.08705644882193"),
    south: parseFloat(searchParams.get("south") ?? "-43.30965832411127"),
    east: parseFloat(searchParams.get("east") ?? "-70.93122786797457"),
    north: parseFloat(searchParams.get("north") ?? "-41.78337582518408"),
  };

  const gridSize = 5;
  const latStep = (bounds.north - bounds.south) / gridSize;
  const lonStep = (bounds.east - bounds.west) / gridSize;

  const coordinates: Array<{ lat: number; lon: number }> = [];

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      coordinates.push({
        lat: bounds.south + i * latStep,
        lon: bounds.west + j * lonStep,
      });
    }
  }

  console.log(`[Weather API] Requesting weather for ${coordinates.length} points using OpenWeatherMap`);

  const fetchWeatherPoint = async (coord: { lat: number; lon: number }): Promise<WeatherPoint | null> => {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}&units=metric`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 300 },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.cod !== 200 || !data.main || !data.coord) {
        return null;
      }

      const rain = data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0;
      const snow = data.snow?.["1h"] ?? data.snow?.["3h"] ?? 0;
      const precipitation = rain + snow;

      return {
        lat: data.coord.lat,
        lon: data.coord.lon,
        windSpeed: data.wind?.speed ?? 0,
        windDir: data.wind?.deg ?? 0,
        precipitation: precipitation,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return null;
    }
  };

  try {
    const results = await Promise.allSettled(
      coordinates.map(coord => fetchWeatherPoint(coord))
    );

    const weatherPoints: WeatherPoint[] = [];
    let successCount = 0;

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value !== null) {
        weatherPoints.push(result.value);
        successCount++;
      }
    });

    console.log(`[Weather API] Successfully fetched ${successCount}/${coordinates.length} points`);

    return Response.json({ points: weatherPoints });
  } catch (error) {
    console.error(`[Weather API] Exception:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: errorMessage, points: [] },
      { status: 500 }
    );
  }
}
