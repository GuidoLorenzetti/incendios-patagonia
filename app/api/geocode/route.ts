import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return new Response("Missing lat or lon", { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "FireWatch App",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return Response.json({ name: "Lugar desconocido" });
      }

      const data = await response.json();
      
      let name = "Lugar desconocido";
      
      if (data.address) {
        const addr = data.address;
        
        const namePriority = [
          addr.city,
          addr.town,
          addr.village,
          addr.hamlet,
          addr.locality,
          addr.neighbourhood,
          addr.suburb,
          addr.municipality,
          addr.lake,
          addr.reservoir,
          addr.waterway,
          addr.forest,
          addr.natural,
          addr.peak,
          addr.mountain,
          addr.place,
          addr.landuse,
          addr.amenity,
        ].find(n => n && n.trim() !== "");
        
        if (namePriority) {
          name = namePriority;
        } else if (data.display_name) {
          const parts = data.display_name.split(",");
          if (parts.length > 0) {
            name = parts[0].trim();
          }
        }
      } else if (data.display_name) {
        const parts = data.display_name.split(",");
        if (parts.length > 0) {
          name = parts[0].trim();
        }
      }

      return Response.json({ name });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error("Geocoding timeout");
      } else {
        throw fetchError;
      }
      return Response.json({ name: "Lugar desconocido" });
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return Response.json({ name: "Lugar desconocido" });
  }
}
