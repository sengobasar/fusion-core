import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";

/* ================= TYPES ================= */

type Alert = {
    alert_id: string;
    house_id: string;
    issue: string;
    severity: "WARNING" | "CRITICAL";
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    durationMinutes: number;
    startedAt: string;
};

/* ================= VIEW ================= */

export default function AlertsView() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filter, setFilter] = useState<"OPEN" | "ALL">("OPEN");

    useEffect(() => {
        loadAlerts();
    }, [filter]);

    async function loadAlerts() {
        const db = await dbPromise;
        let all: Alert[] = await db.getAll("alerts");

        if (filter === "OPEN") {
            all = all.filter(a => a.status === "OPEN");
        }

        all.sort(
            (a, b) =>
                new Date(b.startedAt).getTime() -
                new Date(a.startedAt).getTime()
        );

        setAlerts(all);
    }

    async function acknowledge(alertId: string) {
        const db = await dbPromise;
        const alert = await db.get("alerts", alertId);
        if (!alert) return;

        alert.status = "ACKNOWLEDGED";
        await db.put("alerts", alert);
        loadAlerts();
    }

    async function resolve(alertId: string) {
        const db = await dbPromise;
        const alert = await db.get("alerts", alertId);
        if (!alert) return;

        alert.status = "RESOLVED";
        await db.put("alerts", alert);
        loadAlerts();
    }

    /* ================= RENDER ================= */

    return (
        <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
            <h2>Alerts</h2>

            {/* FILTER */}
            <div style={{ marginBottom: "16px" }}>
                <button
                    onClick={() => setFilter("OPEN")}
                    disabled={filter === "OPEN"}
                >
                    Open Alerts
                </button>
                <button
                    onClick={() => setFilter("ALL")}
                    disabled={filter === "ALL"}
                    style={{ marginLeft: "8px" }}
                >
                    All Alerts
                </button>
            </div>

            {alerts.length === 0 && (
                <p style={{ opacity: 0.6 }}>No alerts to show.</p>
            )}

            {/* ALERT LIST */}
            <div style={{ display: "grid", gap: "12px" }}>
                {alerts.map(a => (
                    <div
                        key={a.alert_id}
                        className="card"
                        style={{
                            borderLeft: `6px solid ${a.severity === "CRITICAL" ? "#ef4444" : "#f59e0b"
                                }`,
                            padding: "16px",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong>
                                {a.house_id} — {a.issue}
                            </strong>
                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color:
                                        a.severity === "CRITICAL" ? "#ef4444" : "#f59e0b",
                                }}
                            >
                                {a.severity}
                            </span>
                        </div>

                        <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                            Duration: {a.durationMinutes} min
                        </div>

                        <div
                            style={{
                                fontSize: "0.75rem",
                                opacity: 0.7,
                                marginTop: "4px",
                            }}
                        >
                            Started at: {new Date(a.startedAt).toLocaleTimeString()}
                        </div>

                        {/* ACTIONS */}
                        {a.status === "OPEN" && (
                            <div style={{ marginTop: "12px" }}>
                                <button onClick={() => acknowledge(a.alert_id)}>
                                    Acknowledge
                                </button>
                                <button
                                    onClick={() => resolve(a.alert_id)}
                                    style={{ marginLeft: "8px" }}
                                >
                                    Resolve
                                </button>
                            </div>
                        )}

                        {a.status !== "OPEN" && (
                            <div style={{ marginTop: "8px", fontSize: "0.75rem" }}>
                                Status: <strong>{a.status}</strong>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
