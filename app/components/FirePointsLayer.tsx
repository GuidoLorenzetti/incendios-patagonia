"use client";

import { useMemo } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { TimeRange } from "./MapControls";
import { parseFirmsUtc, toArgentinaTimeString, timeAgo, filterByPreviousPeriod } from "../lib/time";
import { useFireData } from "./FireDataContext";

interface FirePointsLayerProps {
  visible: boolean;
  timeRange: TimeRange;
}

export default function FirePointsLayer({ visible, timeRange }: FirePointsLayerProps) {
  const { data } = useFireData();

  const filteredFeatures = useMemo(() => {
    return filterByPreviousPeriod(data.features, timeRange);
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
