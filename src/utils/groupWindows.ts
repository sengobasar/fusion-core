type TimeWindow = {
  type: string;
  durationMinutes: number;
};

export function groupWindows(windows: TimeWindow[]) {
  const grouped: Record<string, number> = {};

  for (const w of windows) {
    grouped[w.type] = (grouped[w.type] || 0) + w.durationMinutes;
  }

  return grouped;
}
