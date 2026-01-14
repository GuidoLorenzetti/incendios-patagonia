import { FireEvent, haversineMeters } from "./clustering";
import { parseFirmsUtc, getTimeRangeMs } from "./time";
import { TimeRange } from "../components/MapControls";

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
  allFeatures: any[],
  timeRange: TimeRange
): FireEvent[] {
  const nowUtc = new Date();
  const rangeMs = getTimeRangeMs(timeRange);
  const cutoffSelectedRange = nowUtc.getTime() - rangeMs;
  const recentHoursMs = 6 * 60 * 60 * 1000;
  const cutoffRecent = nowUtc.getTime() - recentHoursMs;

  const featuresInSelectedRange = allFeatures.filter((f) => {
    if (!f.properties.acq_date || !f.properties.acq_time) return false;
    const dateUtc = parseFirmsUtc(f.properties.acq_date, f.properties.acq_time);
    return dateUtc.getTime() >= cutoffSelectedRange;
  });

  const featuresRecent = allFeatures.filter((f) => {
    if (!f.properties.acq_date || !f.properties.acq_time) return false;
    const dateUtc = parseFirmsUtc(f.properties.acq_date, f.properties.acq_time);
    return dateUtc.getTime() >= cutoffRecent;
  });

  return events.map((event) => {
    const [lat, lon] = event.centroid;
    const eventRadius = 1500;

    const pointsInSelectedRange = featuresInSelectedRange.filter((f) => {
      const [fLon, fLat] = f.geometry.coordinates;
      const dist = haversineMeters(lat, lon, fLat, fLon);
      return dist <= eventRadius;
    });

    const pointsRecent = featuresRecent.filter((f) => {
      const [fLon, fLat] = f.geometry.coordinates;
      const dist = haversineMeters(lat, lon, fLat, fLon);
      return dist <= eventRadius;
    });

    const totalInRange = pointsInSelectedRange.length;
    const countRecent = pointsRecent.length;

    const frpTotalInRange = pointsInSelectedRange.reduce((sum, f) => {
      const frp = f.properties.frp ? Number(f.properties.frp) : 0;
      return sum + frp;
    }, 0);

    const frpRecent = pointsRecent.reduce((sum, f) => {
      const frp = f.properties.frp ? Number(f.properties.frp) : 0;
      return sum + frp;
    }, 0);

    const latestTimestampRecent = pointsRecent.length > 0
      ? Math.max(...pointsRecent.map((f) => {
          const dateUtc = parseFirmsUtc(f.properties.acq_date!, f.properties.acq_time!);
          return dateUtc.getTime();
        }))
      : 0;

    const lastSeenUtcMs = Math.max(event.lastSeenUtcMs, latestTimestampRecent);

    const analysis = determineTrend(
      totalInRange,
      countRecent,
      frpTotalInRange,
      frpRecent,
      event.count,
      timeRange
    );

    return {
      ...event,
      trend: analysis.trend,
      trendReason: analysis.reason,
      historicalCount: totalInRange,
      count24h: countRecent,
      frp24h: frpRecent,
      frp24h_48h: frpTotalInRange,
      lastSeenUtcMs,
    };
  });
}

function determineTrend(
  totalInRange: number,
  countRecent: number,
  frpTotalInRange: number,
  frpRecent: number,
  totalEventCount: number,
  timeRange: TimeRange
): TrendAnalysis {
  const hasNoRecentActivity = countRecent === 0 && frpRecent === 0;
  const hasNoActivityInRange = totalInRange === 0 && frpTotalInRange === 0;
  const hasSignificantActivityInRange = totalInRange >= 10 || frpTotalInRange >= 100 || totalEventCount >= 50;
  const isLongRange = timeRange === "7d" || timeRange === "48h";
  const isShortRange = timeRange === "6h" || timeRange === "12h" || timeRange === "24h";
  const hasVerySignificantActivity = totalInRange >= 50 || frpTotalInRange >= 500 || totalEventCount >= 100;

  if (hasNoActivityInRange && hasNoRecentActivity) {
    return {
      trend: "estable",
      reason: `Sin actividad en ${timeRange} ni en las últimas 6 horas.`,
      currentPeriodCount: countRecent,
      previousPeriodCount: totalInRange,
      currentPeriodFrp: frpRecent,
      previousPeriodFrp: frpTotalInRange,
    };
  }

  if (hasNoActivityInRange && countRecent > 0) {
    return {
      trend: "creciente",
      reason: `Nueva actividad reciente: ${countRecent} detecciones en las últimas 6 horas (FRP: ${frpRecent.toFixed(1)}). Sin actividad previa en ${timeRange}.`,
      currentPeriodCount: countRecent,
      previousPeriodCount: totalInRange,
      currentPeriodFrp: frpRecent,
      previousPeriodFrp: frpTotalInRange,
    };
  }

  if (totalInRange === 0) {
    return {
      trend: "creciente",
      reason: `${countRecent} detecciones en las últimas 6 horas (FRP: ${frpRecent.toFixed(1)}). Sin actividad previa en ${timeRange}.`,
      currentPeriodCount: countRecent,
      previousPeriodCount: totalInRange,
      currentPeriodFrp: frpRecent,
      previousPeriodFrp: frpTotalInRange,
    };
  }

  if (hasNoRecentActivity && totalInRange > 0) {
    if (isLongRange && hasSignificantActivityInRange) {
      return {
        trend: "extinto",
        reason: `Sin actividad en las últimas 6 horas. Total en ${timeRange}: ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}).`,
        currentPeriodCount: countRecent,
        previousPeriodCount: totalInRange,
        currentPeriodFrp: frpRecent,
        previousPeriodFrp: frpTotalInRange,
      };
    }
    
    if (hasVerySignificantActivity && !isShortRange) {
      return {
        trend: "extinto",
        reason: `Sin actividad en las últimas 6 horas. Total en ${timeRange}: ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}).`,
        currentPeriodCount: countRecent,
        previousPeriodCount: totalInRange,
        currentPeriodFrp: frpRecent,
        previousPeriodFrp: frpTotalInRange,
      };
    }
    
    if (isShortRange) {
      return {
        trend: "decreciente",
        reason: `Sin actividad reciente. Total en ${timeRange}: ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}). La actividad fue más temprana en este período.`,
        currentPeriodCount: countRecent,
        previousPeriodCount: totalInRange,
        currentPeriodFrp: frpRecent,
        previousPeriodFrp: frpTotalInRange,
      };
    }
    
    return {
      trend: "decreciente",
      reason: `Sin actividad reciente. Total en ${timeRange}: ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}).`,
      currentPeriodCount: countRecent,
      previousPeriodCount: totalInRange,
      currentPeriodFrp: frpRecent,
      previousPeriodFrp: frpTotalInRange,
    };
  }

  const recentRatio = totalInRange > 0 ? countRecent / totalInRange : countRecent > 0 ? 2 : 0;
  const frpRatio = frpTotalInRange > 0 ? frpRecent / frpTotalInRange : frpRecent > 0 ? 2 : 0;
  const combinedRatio = (recentRatio + frpRatio) / 2;

  let expectedRecentRatio: number;
  if (timeRange === "7d") {
    expectedRecentRatio = 0.1;
  } else if (timeRange === "48h") {
    expectedRecentRatio = 0.2;
  } else if (timeRange === "24h") {
    expectedRecentRatio = 0.25;
  } else {
    expectedRecentRatio = 0.5;
  }

  if (combinedRatio > expectedRecentRatio * 1.5) {
    const recentPercent = Math.round((countRecent / totalInRange) * 100);
    return {
      trend: "creciente",
      reason: `Actividad reciente alta: ${countRecent} detecciones en últimas 6h (${recentPercent}% del total en ${timeRange}). FRP reciente: ${frpRecent.toFixed(1)} vs total: ${frpTotalInRange.toFixed(1)}.`,
      currentPeriodCount: countRecent,
      previousPeriodCount: totalInRange,
      currentPeriodFrp: frpRecent,
      previousPeriodFrp: frpTotalInRange,
    };
  }

  if (combinedRatio < expectedRecentRatio * 0.5 && hasSignificantActivityInRange) {
    const recentPercent = totalInRange > 0 ? Math.round((countRecent / totalInRange) * 100) : 0;
    return {
      trend: "decreciente",
      reason: `Actividad reciente baja: ${countRecent} detecciones en últimas 6h (${recentPercent}% del total en ${timeRange}). Total: ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}).`,
      currentPeriodCount: countRecent,
      previousPeriodCount: totalInRange,
      currentPeriodFrp: frpRecent,
      previousPeriodFrp: frpTotalInRange,
    };
  }

  const recentPercent = totalInRange > 0 ? Math.round((countRecent / totalInRange) * 100) : 0;
  return {
    trend: "estable",
    reason: `Actividad constante: ${countRecent} detecciones en últimas 6h (${recentPercent}% del total en ${timeRange}). Total: ${totalInRange} detecciones. FRP reciente: ${frpRecent.toFixed(1)}, total: ${frpTotalInRange.toFixed(1)}.`,
    currentPeriodCount: countRecent,
    previousPeriodCount: totalInRange,
    currentPeriodFrp: frpRecent,
    previousPeriodFrp: frpTotalInRange,
  };
}

