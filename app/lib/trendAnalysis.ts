import { FireEvent, haversineMeters } from "./clustering";
import { parseFirmsUtc, filterByCurrentPeriod, getCurrentPeriodLabel } from "./time";
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
  allFeatures: { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> }[],
  timeRange: TimeRange
): FireEvent[] {
  const featuresCurrent = filterByCurrentPeriod(allFeatures, timeRange);

  return events.map((event) => {
    const [lat, lon] = event.centroid;
    const eventRadius = 1500;

    const pointsCurrent = featuresCurrent.filter((f) => {
      const [fLon, fLat] = f.geometry.coordinates;
      const dist = haversineMeters(lat, lon, fLat, fLon);
      return dist <= eventRadius;
    });

    const totalInRange = event.count;
    const countRecent = pointsCurrent.length;

    const frpTotalInRange = event.frpSum;
    const frpRecent = pointsCurrent.reduce((sum, f) => {
      const frp = f.properties.frp ? Number(f.properties.frp) : 0;
      return sum + frp;
    }, 0);

    const latestTimestampRecent = pointsCurrent.length > 0
      ? Math.max(...pointsCurrent.map((f) => {
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
  const currentPeriodLabel = getCurrentPeriodLabel(timeRange);

  if (hasNoActivityInRange && hasNoRecentActivity) {
    return {
      trend: "estable",
      reason: `Sin actividad en el período anterior (${timeRange}) ni en el período actual (${currentPeriodLabel}).`,
      currentPeriodCount: countRecent,
      previousPeriodCount: totalInRange,
      currentPeriodFrp: frpRecent,
      previousPeriodFrp: frpTotalInRange,
    };
  }

  if (hasNoActivityInRange && countRecent > 0) {
    return {
      trend: "creciente",
      reason: `Nueva actividad en período actual: ${countRecent} detecciones en ${currentPeriodLabel} (FRP: ${frpRecent.toFixed(1)}). Sin actividad en período anterior (${timeRange}).`,
      currentPeriodCount: countRecent,
      previousPeriodCount: totalInRange,
      currentPeriodFrp: frpRecent,
      previousPeriodFrp: frpTotalInRange,
    };
  }

  if (totalInRange === 0) {
    return {
      trend: "creciente",
      reason: `${countRecent} detecciones en período actual (${currentPeriodLabel}, FRP: ${frpRecent.toFixed(1)}). Sin actividad en período anterior (${timeRange}).`,
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
        reason: `Sin actividad en período actual (${currentPeriodLabel}). Período anterior (${timeRange}): ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}).`,
        currentPeriodCount: countRecent,
        previousPeriodCount: totalInRange,
        currentPeriodFrp: frpRecent,
        previousPeriodFrp: frpTotalInRange,
      };
    }

    if (hasVerySignificantActivity && !isShortRange) {
      return {
        trend: "extinto",
        reason: `Sin actividad en período actual (${currentPeriodLabel}). Período anterior (${timeRange}): ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}).`,
        currentPeriodCount: countRecent,
        previousPeriodCount: totalInRange,
        currentPeriodFrp: frpRecent,
        previousPeriodFrp: frpTotalInRange,
      };
    }

    if (isShortRange) {
      return {
        trend: "decreciente",
        reason: `Sin actividad en período actual (${currentPeriodLabel}). Período anterior (${timeRange}): ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}).`,
        currentPeriodCount: countRecent,
        previousPeriodCount: totalInRange,
        currentPeriodFrp: frpRecent,
        previousPeriodFrp: frpTotalInRange,
      };
    }

    return {
      trend: "decreciente",
      reason: `Sin actividad en período actual (${currentPeriodLabel}). Período anterior (${timeRange}): ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}).`,
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
    expectedRecentRatio = 0.5;
  } else if (timeRange === "48h") {
    expectedRecentRatio = 0.5;
  } else if (timeRange === "24h") {
    expectedRecentRatio = 0.5;
  } else {
    expectedRecentRatio = 0.5;
  }

  if (combinedRatio > expectedRecentRatio * 1.5) {
    const recentPercent = Math.round((countRecent / totalInRange) * 100);
    return {
      trend: "creciente",
      reason: `Actividad aumentando: ${countRecent} detecciones en período actual (${currentPeriodLabel}, ${recentPercent}% del período anterior). FRP: ${frpRecent.toFixed(1)} vs ${frpTotalInRange.toFixed(1)}.`,
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
      reason: `Actividad disminuyendo: ${countRecent} detecciones en período actual (${currentPeriodLabel}, ${recentPercent}% del período anterior). Período anterior (${timeRange}): ${totalInRange} detecciones (FRP: ${frpTotalInRange.toFixed(1)}).`,
      currentPeriodCount: countRecent,
      previousPeriodCount: totalInRange,
      currentPeriodFrp: frpRecent,
      previousPeriodFrp: frpTotalInRange,
    };
  }

  const recentPercent = totalInRange > 0 ? Math.round((countRecent / totalInRange) * 100) : 0;
  return {
    trend: "estable",
    reason: `Actividad constante: ${countRecent} detecciones en período actual (${currentPeriodLabel}, ${recentPercent}% del período anterior). Período anterior (${timeRange}): ${totalInRange} detecciones. FRP actual: ${frpRecent.toFixed(1)}, anterior: ${frpTotalInRange.toFixed(1)}.`,
    currentPeriodCount: countRecent,
    previousPeriodCount: totalInRange,
    currentPeriodFrp: frpRecent,
    previousPeriodFrp: frpTotalInRange,
  };
}
