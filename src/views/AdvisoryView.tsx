import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import { buildAdvisoryActions, type AdvisoryAction } from "../utils/advisoryRules";

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

export default function AdvisoryView() {
    const [actions, setActions] = useState<AdvisoryAction[]>([]);

    useEffect(() => {
        loadAdvisory();
    }, []);

    async function loadAdvisory() {
        const db = await dbPromise;

        const allAlerts: Alert[] = await db.getAll("alerts");
        const openAlerts = allAlerts.filter((a) => a.status === "OPEN");

        const advisoryActions = buildAdvisoryActions(openAlerts);
        setActions(advisoryActions);
    }

    /* ================= RENDER ================= */

    return (
        <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
            <h2>Advisory Actions</h2>

            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                Suggested human actions based on current open alerts. No action is automated.
            </p>

            {actions.length === 0 && (
                <p style={{ opacity: 0.6 }}>
                    No advisory actions at the moment.
                </p>
            )}

            <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
                {actions.map((a) => (
                    <div
                        key={a.alertId}
                        className="card"
                        style={{
                            padding: "16px",
                            borderLeft: `6px solid ${a.priority === "HIGH"
                                ? "#ef4444"
                                : a.priority === "MEDIUM"
                                    ? "#f59e0b"
                                    : "#94a3b8"
                                }`,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong>
                                {a.house_id} — {a.title}
                            </strong>
                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color:
                                        a.priority === "HIGH"
                                            ? "#ef4444"
                                            : a.priority === "MEDIUM"
                                                ? "#f59e0b"
                                                : "#64748b",
                                }}
                            >
                                {a.priority}
                            </span>
                        </div>

                        <div style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                            {a.description}
                        </div>

                        <div
                            style={{
                                marginTop: "6px",
                                fontSize: "0.75rem",
                                opacity: 0.7,
                            }}
                        >
                            Triggered by: {a.issue}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
