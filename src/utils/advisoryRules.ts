/* ======================================================
   Layer 4 — Advisory Rules
   ------------------------------------------------------
   Converts alerts into suggested human actions.
   Deterministic, explainable, non-automated.
   ====================================================== */

export type AdvisoryAction = {
    alertId: string;
    house_id: string;
    issue: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    description: string;
};

type Alert = {
    alert_id: string;
    house_id: string;
    issue: string;
    severity: "WARNING" | "CRITICAL";
    durationMinutes: number;
};

export function buildAdvisoryActions(alerts: Alert[]): AdvisoryAction[] {
    return alerts.map((alert) => {
        switch (alert.issue) {
            case "NO_MATERIAL":
                return {
                    alertId: alert.alert_id,
                    house_id: alert.house_id,
                    issue: alert.issue,
                    priority: "HIGH",
                    title: "Check material availability",
                    description:
                        "Contact warehouse or supply team to confirm material dispatch and availability.",
                };

            case "NO_ORDER":
                return {
                    alertId: alert.alert_id,
                    house_id: alert.house_id,
                    issue: alert.issue,
                    priority: "MEDIUM",
                    title: "Verify production planning",
                    description:
                        "Check planning desk for order assignment or scheduling gaps.",
                };

            case "THREAD_BREAK":
                return {
                    alertId: alert.alert_id,
                    house_id: alert.house_id,
                    issue: alert.issue,
                    priority: "MEDIUM",
                    title: "Inspect machine / quality issue",
                    description:
                        "Request maintenance or quality team to inspect thread break cause.",
                };

            default:
                return {
                    alertId: alert.alert_id,
                    house_id: alert.house_id,
                    issue: alert.issue,
                    priority: "LOW",
                    title: "Review alert",
                    description:
                        "Review alert details and decide appropriate next steps.",
                };
        }
    });
}
