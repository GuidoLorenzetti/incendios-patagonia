export function parseFirmsUtc(acq_date: string, acq_time: string): Date {
  const timePadded = acq_time.padStart(4, "0");
  const year = parseInt(acq_date.substring(0, 4));
  const month = parseInt(acq_date.substring(5, 7)) - 1;
  const day = parseInt(acq_date.substring(8, 10));
  const hour = parseInt(timePadded.substring(0, 2));
  const minute = parseInt(timePadded.substring(2, 4));
  return new Date(Date.UTC(year, month, day, hour, minute));
}

export function toArgentinaTimeString(dateUtc: Date): string {
  const argDate = new Date(dateUtc.getTime() - 3 * 60 * 60 * 1000);
  const year = argDate.getUTCFullYear();
  const month = String(argDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(argDate.getUTCDate()).padStart(2, "0");
  const hours = String(argDate.getUTCHours()).padStart(2, "0");
  const minutes = String(argDate.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function timeAgo(dateUtc: Date, nowUtc: Date = new Date()): string {
  const diffMs = nowUtc.getTime() - dateUtc.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `hace ${diffMins}m`;
  } else if (diffHours < 24) {
    const mins = diffMins % 60;
    return mins > 0 ? `hace ${diffHours}h ${mins}m` : `hace ${diffHours}h`;
  } else {
    return `hace ${diffDays}d`;
  }
}

export function getTimeRangeMs(range: string): number {
  switch (range) {
    case "6h":
      return 6 * 60 * 60 * 1000;
    case "12h":
      return 12 * 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "48h":
      return 48 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export function getDaysForApi(range: string): number {
  switch (range) {
    case "6h":
    case "12h":
    case "24h":
      return 1;
    case "48h":
      return 2;
    case "7d":
      return 5;
    default:
      return 1;
  }
}

export function getMaxDaysForHistorical(): number {
  return 5;
}

export function getCurrentPeriodLabel(range: string): string {
  switch (range) {
    case "6h":
      return "3h";
    case "12h":
      return "6h";
    case "24h":
      return "12h";
    case "48h":
      return "24h";
    case "7d":
      return "3.5d";
    default:
      return "12h";
  }
}

export function filterByTimeRange(features: any[], range: string): any[] {
  const nowUtc = new Date();
  const rangeMs = getTimeRangeMs(range);
  const cutoffTime = nowUtc.getTime() - rangeMs;

  return features.filter((feature) => {
    const props = feature.properties;
    if (!props.acq_date || !props.acq_time) return false;
    const dateUtc = parseFirmsUtc(props.acq_date, props.acq_time);
    return dateUtc.getTime() >= cutoffTime;
  });
}

export function filterByPreviousPeriod(features: any[], range: string): any[] {
  const nowUtc = new Date();
  const rangeMs = getTimeRangeMs(range);
  const halfRangeMs = rangeMs / 2;
  const cutoffStart = nowUtc.getTime() - rangeMs;
  const cutoffEnd = nowUtc.getTime() - halfRangeMs;

  return features.filter((feature) => {
    const props = feature.properties;
    if (!props.acq_date || !props.acq_time) return false;
    const dateUtc = parseFirmsUtc(props.acq_date, props.acq_time);
    const timestamp = dateUtc.getTime();
    return timestamp >= cutoffStart && timestamp < cutoffEnd;
  });
}

export function filterByCurrentPeriod(features: any[], range: string): any[] {
  const nowUtc = new Date();
  const rangeMs = getTimeRangeMs(range);
  const halfRangeMs = rangeMs / 2;
  const cutoffTime = nowUtc.getTime() - halfRangeMs;

  return features.filter((feature) => {
    const props = feature.properties;
    if (!props.acq_date || !props.acq_time) return false;
    const dateUtc = parseFirmsUtc(props.acq_date, props.acq_time);
    return dateUtc.getTime() >= cutoffTime;
  });
}

export function filterByTimestamp(features: any[], maxTimestamp: number): any[] {
  return features.filter((feature) => {
    const props = feature.properties;
    if (!props.acq_date || !props.acq_time) return false;
    const dateUtc = parseFirmsUtc(props.acq_date, props.acq_time);
    return dateUtc.getTime() <= maxTimestamp;
  });
}

export function filterByTimeWindow(features: any[], endTime: number, windowHours: number): any[] {
  const startTime = endTime - (windowHours * 60 * 60 * 1000);
  return features.filter((feature) => {
    const props = feature.properties;
    if (!props.acq_date || !props.acq_time) return false;
    const dateUtc = parseFirmsUtc(props.acq_date, props.acq_time);
    const timestamp = dateUtc.getTime();
    return timestamp >= startTime && timestamp <= endTime;
  });
}

/**
 * Filtra features por ventana de tiempo, extendiendo cada detección 6h en cada sentido.
 * Esto significa que una detección "cubre" 6h antes y 6h después de su timestamp.
 * Si una detección está dentro de la ventana extendida, se incluye.
 */
export function filterByTimeWindowWithExtension(features: any[], endTime: number, windowHours: number, extensionHours: number = 6): any[] {
  const windowStart = endTime - (windowHours * 60 * 60 * 1000);
  const extensionMs = extensionHours * 60 * 60 * 1000;
  
  // Extender la ventana de búsqueda para incluir detecciones que puedan "cubrir" nuestro período
  const searchStart = windowStart - extensionMs;
  const searchEnd = endTime + extensionMs;
  
  // Primero obtener todas las features en el rango extendido
  const featuresInExtendedRange = features.filter((feature) => {
    const props = feature.properties;
    if (!props.acq_date || !props.acq_time) return false;
    const dateUtc = parseFirmsUtc(props.acq_date, props.acq_time);
    const timestamp = dateUtc.getTime();
    return timestamp >= searchStart && timestamp <= searchEnd;
  });
  
  // Luego filtrar aquellas cuya "cobertura extendida" intersecta con nuestra ventana
  return featuresInExtendedRange.filter((feature) => {
    const props = feature.properties;
    if (!props.acq_date || !props.acq_time) return false;
    const dateUtc = parseFirmsUtc(props.acq_date, props.acq_time);
    const timestamp = dateUtc.getTime();
    
    // La detección cubre desde 6h antes hasta 6h después
    const detectionStart = timestamp - extensionMs;
    const detectionEnd = timestamp + extensionMs;
    
    // Si la cobertura de la detección intersecta con nuestra ventana, incluirla
    return detectionEnd >= windowStart && detectionStart <= endTime;
  });
}
