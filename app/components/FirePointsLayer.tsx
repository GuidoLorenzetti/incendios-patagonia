"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { TimeRange } from "./MapControls";
import { parseFirmsUtc, toArgentinaTimeString, timeAgo, filterByTimeRange } from "../lib/time";
import { useFireData } from "./FireDataContext";


interface FirePointsLayerProps {
  visible: boolean;
  timeRange: TimeRange;
  onLastDetectionChange?: (date: Date | null) => void;
}

export default function FirePointsLayer({ visible, timeRange, onLastDetectionChange }: FirePointsLayerProps) {
  const { data } = useFireData();

  useEffect(() => {
    const filtered = filterByTimeRange(data.features, timeRange);

    if (onLastDetectionChange && filtered.length > 0) {
      const timestamps = filtered
        .map((f) => {
          if (f.properties.acq_date && f.properties.acq_time) {
            return parseFirmsUtc(f.properties.acq_date, f.properties.acq_time);
          }
          return null;
        })
        .filter((d): d is Date => d !== null);
      if (timestamps.length > 0) {
        const latest = new Date(Math.max(...timestamps.map((d) => d.getTime())));
        onLastDetectionChange(latest);
      }
    } else if (onLastDetectionChange) {
      onLastDetectionChange(null);
    }
  }, [data, timeRange, onLastDetectionChange]);

  const filteredFeatures = useMemo(() => {
    return filterByTimeRange(data.features, timeRange);
  }, [data, timeRange]);

  const markers = useMemo(() => {
    if (!visible) return null;
    
    return filteredFeatures.map((feature, idx) => {
      const [lon, lat] = feature.geometry.coordinates;
      const props = feature.properties;
      const confidence = props.confidence ?? "N/A";
      const frp = props.frp ?? "N/A";
      const satellite = props.satellite ?? "N/A";
      let dateTime = "N/A";
      let timeAgoStr = "";
      if (props.acq_date && props.acq_time) {
        const dateUtc = parseFirmsUtc(props.acq_date, props.acq_time);
        dateTime = toArgentinaTimeString(dateUtc);
        timeAgoStr = timeAgo(dateUtc);
      }
      const key = `fire-${idx}-${lat}-${lon}-${props.acq_date}-${props.acq_time}`;

      return (
        <CircleMarker
          key={key}
          center={[lat, lon]}
          radius={5}
          pathOptions={{
            color: "#ff0000",
            fillColor: "#ff4444",
            fillOpacity: 0.8,
            weight: 2,
          }}
        >
          <Popup>
            <div style={{ minWidth: "150px" }}>
              <strong>Foco de Incendio</strong>
              <br />
              <strong>Confidence:</strong> {confidence}
              <br />
              <strong>FRP:</strong> {frp}
              <br />
              <strong>Satélite:</strong> {satellite}
              <br />
              <strong>Fecha/Hora:</strong> {dateTime} (UTC-3)
              <br />
              {timeAgoStr && <><strong>Hace:</strong> {timeAgoStr}</>}
            </div>
          </Popup>
        </CircleMarker>
      );
    });
  }, [filteredFeatures, visible]);

  return <>{markers}</>;
}
