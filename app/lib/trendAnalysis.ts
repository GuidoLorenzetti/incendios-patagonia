import { FireEvent, haversineMeters } from "./clustering";
import { parseFirmsUtc } from "./time";

const DETECTION_EXTENSION_HOURS = 6;
const DETECTION_EXTENSION_MS = DETECTION_EXTENSION_HOURS * 60 * 60 * 1000;

export interface TrendAnalysis {
  trend: "creciente" | "decreciente" | "estable" | "extinto";
  reason: string;
  currentPeriodCount: number;
  previousPeriodCount: number;
  currentPeriodFrp: number;
  previousPeriodFrp: number;
}

export function analyzeTrends(
  events: FireEvent[],
  currentWindowFeatures: any[],
  previousWindowFeatures: any[],
  windowHours: number,
  selectedTime: Date,
  allRecentFeatures: any[]
): FireEvent[] {
  const selectedTimeMs = selectedTime.getTime();
  const maxAgeForActiveHours = 24; // Eventos sin actividad en las últimas 24h se consideran extintos
  const maxAgeForActiveMs = maxAgeForActiveHours * 60 * 60 * 1000;
  const comparisonHours = 12; // Comparar siempre con 12 horas atrás
  const recentWindowHours = windowHours * 3; // Considerar últimas 3 ventanas (9h para ventana de 3h)
  const recentWindowStart = selectedTimeMs - (recentWindowHours * 60 * 60 * 1000);

  return events.map((event) => {
    const [lat, lon] = event.centroid;
    const eventRadius = 1500;

    // Filtrar puntos por distancia al evento en el tiempo actual
    const pointsCurrent = currentWindowFeatures.filter((f) => {
      const [fLon, fLat] = f.geometry.coordinates;
      const dist = haversineMeters(lat, lon, fLat, fLon);
      return dist <= eventRadius;
    });

    // Filtrar puntos por distancia al evento en el tiempo de comparación (12 horas antes)
    const pointsPrevious = previousWindowFeatures.filter((f) => {
      const [fLon, fLat] = f.geometry.coordinates;
      const dist = haversineMeters(lat, lon, fLat, fLon);
      return dist <= eventRadius;
    });

    // Verificar actividad en el tiempo de comparación (12 horas antes)
    // Usar las mismas features que pointsPrevious pero contar para verificar si había actividad
    const pointsInComparisonWindow = pointsPrevious;

    const countCurrent = pointsCurrent.length;
    const countPrevious = pointsPrevious.length;
    const countInComparisonWindow = pointsInComparisonWindow.length;

    const frpCurrent = pointsCurrent.reduce((sum, f) => {
      const frp = f.properties.frp ? Number(f.properties.frp) : 0;
      return sum + frp;
    }, 0);

    const frpPrevious = pointsPrevious.reduce((sum, f) => {
      const frp = f.properties.frp ? Number(f.properties.frp) : 0;
      return sum + frp;
    }, 0);

    const latestTimestampCurrent = pointsCurrent.length > 0
      ? Math.max(...pointsCurrent.map((f) => {
          const dateUtc = parseFirmsUtc(f.properties.acq_date!, f.properties.acq_time!);
          return dateUtc.getTime();
        }))
      : 0;

    const lastSeenUtcMs = Math.max(event.lastSeenUtcMs, latestTimestampCurrent);
    const hoursSinceLastSeen = (selectedTimeMs - lastSeenUtcMs) / (60 * 60 * 1000);

    // Si hay actividad en la ventana actual, el evento está activo
    // Pero si no hay actividad en las ventanas anteriores y han pasado más de 24h desde la última detección,
    // podría ser un evento antiguo que ya no es relevante
    // Sin embargo, si tiene actividad actual, siempre se muestra
    
    // Si NO hay actividad en la ventana actual Y no hay actividad en la ventana de comparación
    // Y han pasado más de 24h, marcar como extinto
    if (countCurrent === 0 && countInComparisonWindow === 0 && hoursSinceLastSeen > maxAgeForActiveHours) {
      return {
        ...event,
        trend: "extinto",
        trendReason: `Sin actividad en las últimas ${recentWindowHours}h. Última detección hace ${Math.round(hoursSinceLastSeen)}h.`,
        historicalCount: countPrevious,
        count24h: countCurrent,
        frp24h: frpCurrent,
        frp24h_48h: frpPrevious,
        lastSeenUtcMs,
      };
    }

    // Si hay actividad actual, siempre analizar tendencias normalmente
    // Si no hay actividad actual pero hay en ventanas anteriores, también analizar

    const analysis = determineTrend(
      countCurrent,
      countPrevious,
      frpCurrent,
      frpPrevious,
      event.count,
      windowHours,
      countInComparisonWindow
    );

    return {
      ...event,
      trend: analysis.trend,
      trendReason: analysis.reason,
      historicalCount: countPrevious,
      count24h: countCurrent,
      frp24h: frpCurrent,
      frp24h_48h: frpPrevious,
      lastSeenUtcMs,
    };
  });
}

function determineTrend(
  countCurrent: number,
  countPrevious: number,
  frpCurrent: number,
  frpPrevious: number,
  totalEventCount: number,
  windowHours: number,
  countInComparisonWindow: number
): TrendAnalysis {
  const hasNoCurrentActivity = countCurrent === 0 && frpCurrent === 0;
  const hasNoPreviousActivity = countPrevious === 0 && frpPrevious === 0;
  const hasSignificantPreviousActivity = countPrevious >= 10 || frpPrevious >= 100 || totalEventCount >= 50;
  const hasVerySignificantPreviousActivity = countPrevious >= 50 || frpPrevious >= 500 || totalEventCount >= 100;
  const isLongWindow = windowHours >= 24;

  if (hasNoCurrentActivity && hasNoPreviousActivity) {
    return {
      trend: "estable",
      reason: `Sin actividad en la ventana actual (${windowHours}h) ni hace 12 horas.`,
      currentPeriodCount: countCurrent,
      previousPeriodCount: countPrevious,
      currentPeriodFrp: frpCurrent,
      previousPeriodFrp: frpPrevious,
    };
  }

  if (hasNoPreviousActivity && countCurrent > 0) {
    return {
      trend: "creciente",
      reason: `Nueva actividad: ${countCurrent} detecciones en ventana actual (${windowHours}h, FRP: ${frpCurrent.toFixed(1)}). Sin actividad hace 12 horas.`,
      currentPeriodCount: countCurrent,
      previousPeriodCount: countPrevious,
      currentPeriodFrp: frpCurrent,
      previousPeriodFrp: frpPrevious,
    };
  }

  if (hasNoCurrentActivity && hasSignificantPreviousActivity) {
    if (isLongWindow || hasVerySignificantPreviousActivity) {
      return {
        trend: "extinto",
        reason: `Sin actividad en ventana actual (${windowHours}h). Hace 12 horas: ${countPrevious} detecciones (FRP: ${frpPrevious.toFixed(1)}).`,
        currentPeriodCount: countCurrent,
        previousPeriodCount: countPrevious,
        currentPeriodFrp: frpCurrent,
        previousPeriodFrp: frpPrevious,
      };
    }
    return {
      trend: "decreciente",
      reason: `Sin actividad en ventana actual (${windowHours}h). Hace 12 horas: ${countPrevious} detecciones (FRP: ${frpPrevious.toFixed(1)}).`,
      currentPeriodCount: countCurrent,
      previousPeriodCount: countPrevious,
      currentPeriodFrp: frpCurrent,
      previousPeriodFrp: frpPrevious,
    };
  }

  if (countPrevious === 0 && countCurrent > 0) {
    return {
      trend: "creciente",
      reason: `${countCurrent} detecciones en ventana actual (${windowHours}h, FRP: ${frpCurrent.toFixed(1)}). Sin actividad hace 12 horas.`,
      currentPeriodCount: countCurrent,
      previousPeriodCount: countPrevious,
      currentPeriodFrp: frpCurrent,
      previousPeriodFrp: frpPrevious,
    };
  }

  const countRatio = countPrevious > 0 ? countCurrent / countPrevious : countCurrent > 0 ? 2 : 0;
  const frpRatio = frpPrevious > 0 ? frpCurrent / frpPrevious : frpCurrent > 0 ? 2 : 0;
  const combinedRatio = (countRatio + frpRatio) / 2;

  if (combinedRatio > 1.3) {
    const increasePercent = Math.round((combinedRatio - 1) * 100);
    return {
      trend: "creciente",
      reason: `Aumento del ${increasePercent}%: ${countCurrent} detecciones ahora vs ${countPrevious} hace 12 horas. FRP: ${frpCurrent.toFixed(1)} vs ${frpPrevious.toFixed(1)}.`,
      currentPeriodCount: countCurrent,
      previousPeriodCount: countPrevious,
      currentPeriodFrp: frpCurrent,
      previousPeriodFrp: frpPrevious,
    };
  }

  if (combinedRatio < 0.7 && hasSignificantPreviousActivity) {
    const decreasePercent = Math.round((1 - combinedRatio) * 100);
    return {
      trend: "decreciente",
      reason: `Reducción del ${decreasePercent}%: ${countCurrent} detecciones ahora vs ${countPrevious} hace 12 horas. FRP: ${frpCurrent.toFixed(1)} vs ${frpPrevious.toFixed(1)}.`,
      currentPeriodCount: countCurrent,
      previousPeriodCount: countPrevious,
      currentPeriodFrp: frpCurrent,
      previousPeriodFrp: frpPrevious,
    };
  }

  return {
    trend: "estable",
    reason: `Actividad similar: ${countCurrent} detecciones ahora vs ${countPrevious} hace 12 horas. FRP: ${frpCurrent.toFixed(1)} vs ${frpPrevious.toFixed(1)}.`,
    currentPeriodCount: countCurrent,
    previousPeriodCount: countPrevious,
    currentPeriodFrp: frpCurrent,
    previousPeriodFrp: frpPrevious,
  };
}

