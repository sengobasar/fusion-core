type TimeWindow = {
  type: string;
  durationMinutes: number;
};

type Alert = {
  house_id: string;
  type: string;
  reason: string;
  durationMinutes: number;
};

export function checkThresholds(
  houseId: string,
  windows: TimeWindow[]
): Alert[] {
  const alerts: Alert[] = [];

  for (const w of windows) {
    // 🔴 NO MATERIAL — supply issue
    if (w.type === "NO_MATERIAL" && w.durationMinutes >= 1) {
      alerts.push({
        house_id: houseId,
        type: w.type,
        reason: "Material unavailable for more than 1 minute",
        durationMinutes: w.durationMinutes,
      });
    }

    // 🟠 THREAD BREAK — maintenance / quality
    if (w.type === "THREAD_BREAK" && w.durationMinutes >= 2) {
      alerts.push({
        house_id: houseId,
        type: w.type,
        reason: "Thread break lasted more than 2 minutes",
        durationMinutes: w.durationMinutes,
      });
    }

    // 🔵 NO ORDER — planning issue
    if (w.type === "NO_ORDER" && w.durationMinutes >= 2) {
      alerts.push({
        house_id: houseId,
        type: w.type,
        reason: "No order assigned for more than 2 minutes",
        durationMinutes: w.durationMinutes,
      });
    }
  }

  return alerts;
}
