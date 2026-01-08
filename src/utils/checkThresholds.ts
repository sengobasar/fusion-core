type TimeWindow = {
  type: string;
  durationMinutes: number;
};

export function checkThresholds(
  houseId: string,
  windows: TimeWindow[]
) {
  const alerts = [];

  for (const w of windows) {
    if (w.type === "NO_MATERIAL" && w.durationMinutes > 30) {
      alerts.push({
        house_id: houseId,
        type: w.type,
        reason: "Material delay > 30 minutes",
        durationMinutes: w.durationMinutes,
      });
    }

    if (w.type === "NO_ORDER" && w.durationMinutes > 120) {
      alerts.push({
        house_id: houseId,
        type: w.type,
        reason: "No order > 2 hours",
        durationMinutes: w.durationMinutes,
      });
    }

    if (w.type === "THREAD_BREAK" && w.durationMinutes > 20) {
      alerts.push({
        house_id: houseId,
        type: w.type,
        reason: "Thread break > 20 minutes",
        durationMinutes: w.durationMinutes,
      });
    }
  }

  return alerts;
}
