import { Signal } from "../types/signal";

/*
  Input alert shape (from checkOpenWindows / checkThresholds)
*/
type Alert = {
    house_id: string;
    type: string;
    reason: string;
    durationMinutes: number;
};

/*
  Translate interruption type → signal type
*/
function mapToSignalType(eventType: string): Signal["type"] {
    if (eventType === "NO_MATERIAL") return "SUPPLY_RISK";
    if (eventType === "THREAD_BREAK") return "QUALITY_RISK";
    if (eventType === "NO_ORDER") return "PLANNING_RISK";
    return "PLANNING_RISK"; // safe fallback
}

/*
  Translate duration → severity
*/
function computeSeverity(minutes: number): Signal["severity"] {
    if (minutes >= 120) return "HIGH";
    if (minutes >= 60) return "MEDIUM";
    return "LOW";
}

/*
  Build Layer-3 signals
  Pure function. No side effects.
*/
export function buildSignals(alerts: Alert[]): Signal[] {
    return alerts.map((a) => ({
        houseId: a.house_id,
        type: mapToSignalType(a.type),
        severity: computeSeverity(a.durationMinutes),
        durationMinutes: a.durationMinutes,
        reason: a.reason,
    }));
}
