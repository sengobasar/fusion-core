import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();

    useEffect(() => {
        loadAlerts();
    }, [filter]);

    async function loadAlerts() {
        const db = await dbPromise;
        let all: Alert[] = await db.getAll("alerts");

        if (filter === "OPEN") {
            all = all.filter((a) => a.status === "OPEN");
        }

        all.sort(
            (a, b) =>
                new Date(b.startedAt).getTime() -
                new Date(a.startedAt).getTime()
        );

        setAlerts(all);
    }

    /* ================= ACTIONS ================= */

    async function acknowledge(alertId: string) {
        const db = await dbPromise;
        const alert = await db.get("alerts", alertId);
        if (!alert) return;

        alert.status = "ACKNOWLEDGED";
        await db.put("alerts", alert);

        // 👉 Go to Advisory for human decision-making
        navigate("/advisory");
    }

    async function resolve(alertId: string) {
        const db = await dbPromise;
        const alert = await db.get("alerts", alertId);
        if (!alert) return;

        alert.status = "RESOLVED";
        await db.put("alerts", alert);

        loadAlerts(); // stay on Alerts
    }

    /* ================= DERIVED SUMMARY ================= */

    const openAlerts = alerts.filter((a) => a.status === "OPEN");
    const criticalCount = openAlerts.filter(
        (a) => a.severity === "CRITICAL"
    ).length;
    const warningCount = openAlerts.filter(
        (a) => a.severity === "WARNING"
    ).length;

    const issueCounts: Record<string, number> = {};
    for (const a of openAlerts) {
        issueCounts[a.issue] = (issueCounts[a.issue] || 0) + 1;
    }

    const topIssue =
        Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "None";

    /* ================= RENDER ================= */

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#0f172a",
            padding: "32px"
        }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

                {/* HEADER */}
                <div style={{ marginBottom: "32px" }}>
                    <h1 style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: "white",
                        margin: 0,
                        marginBottom: "8px",
                        letterSpacing: "0.5px"
                    }}>
                        Alert Management
                    </h1>
                    <p style={{
                        color: "#94a3b8",
                        margin: 0,
                        fontSize: "0.95rem"
                    }}>
                        Active production incidents requiring attention
                    </p>
                </div>

                {/* SUMMARY STRIP */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "16px",
                    marginBottom: "32px"
                }}>
                    <div style={{
                        backgroundColor: "#1e293b",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #334155"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            Open Alerts
                        </div>
                        <div style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "white"
                        }}>
                            {openAlerts.length}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: "#1e293b",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #334155"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            Critical
                        </div>
                        <div style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "#ef4444"
                        }}>
                            {criticalCount}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: "#1e293b",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #334155"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            Warnings
                        </div>
                        <div style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "#f59e0b"
                        }}>
                            {warningCount}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: "#1e293b",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #334155"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            Top Issue
                        </div>
                        <div style={{
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: "white"
                        }}>
                            {topIssue}
                        </div>
                    </div>
                </div>

                {/* FILTER TABS */}
                <div style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "24px"
                }}>
                    <button
                        onClick={() => setFilter("OPEN")}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: filter === "OPEN" ? "#1e40af" : "transparent",
                            color: filter === "OPEN" ? "white" : "#94a3b8",
                            border: filter === "OPEN" ? "1px solid #3b82f6" : "1px solid transparent",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                        }}
                    >
                        Open Alerts
                    </button>
                    <button
                        onClick={() => setFilter("ALL")}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: filter === "ALL" ? "#1e40af" : "transparent",
                            color: filter === "ALL" ? "white" : "#94a3b8",
                            border: filter === "ALL" ? "1px solid #3b82f6" : "1px solid transparent",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                        }}
                    >
                        All Alerts
                    </button>
                </div>

                {/* HORIZONTAL LINE SEPARATOR */}
                <div style={{
                    height: "1px",
                    backgroundColor: "#334155",
                    marginBottom: "24px"
                }} />

                {/* EMPTY STATE */}
                {alerts.length === 0 && (
                    <div style={{
                        backgroundColor: "#1e293b",
                        padding: "60px 32px",
                        borderRadius: "8px",
                        textAlign: "center",
                        border: "1px solid #334155"
                    }}>
                        <p style={{
                            color: "#64748b",
                            fontSize: "1.1rem",
                            margin: 0
                        }}>
                            No alerts to display
                        </p>
                    </div>
                )}

                {/* ALERT TICKETS */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}>
                    {alerts.map((a) => {
                        const isCritical = a.severity === "CRITICAL";
                        const isOpen = a.status === "OPEN";

                        return (
                            <div
                                key={a.alert_id}
                                style={{
                                    backgroundColor: isOpen ? "#1e293b" : "#0f172a",
                                    border: `1px solid ${isOpen ? (isCritical ? "#ef4444" : "#f59e0b") : "#334155"}`,
                                    borderRadius: "8px",
                                    padding: "24px",
                                    paddingLeft: "28px",
                                    borderLeft: `6px solid ${isCritical ? "#ef4444" : "#f59e0b"}`,
                                    opacity: isOpen ? 1 : 0.6
                                }}
                            >
                                {/* HEADER ROW */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "16px"
                                }}>
                                    <div style={{ flex: 1 }}>
                                        {/* SEVERITY BADGE */}
                                        <div style={{
                                            display: "inline-block",
                                            padding: "4px 12px",
                                            borderRadius: "4px",
                                            backgroundColor: isCritical ? "#7f1d1d" : "#78350f",
                                            color: isCritical ? "#fecaca" : "#fde68a",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "1px",
                                            marginBottom: "12px"
                                        }}>
                                            {a.severity}
                                        </div>

                                        {/* TITLE */}
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: "1.5rem",
                                            fontWeight: 700,
                                            color: "white",
                                            marginBottom: "8px",
                                            letterSpacing: "0.5px"
                                        }}>
                                            {a.issue}
                                        </h3>

                                        {/* CONTEXT */}
                                        <div style={{
                                            display: "flex",
                                            gap: "24px",
                                            fontSize: "0.9rem",
                                            color: "#94a3b8"
                                        }}>
                                            <div>
                                                <span style={{ color: "#64748b" }}>Machine: </span>
                                                <span style={{ fontWeight: 600, color: "#cbd5e1" }}>{a.house_id}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748b" }}>Duration: </span>
                                                <span style={{ fontWeight: 600, color: "#cbd5e1" }}>{a.durationMinutes} min</span>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748b" }}>Started: </span>
                                                <span style={{ fontWeight: 600, color: "#cbd5e1" }}>
                                                    {new Date(a.startedAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* STATUS INDICATOR */}
                                    {!isOpen && (
                                        <div style={{
                                            padding: "6px 16px",
                                            borderRadius: "4px",
                                            backgroundColor: a.status === "ACKNOWLEDGED" ? "#1e3a8a" : "#166534",
                                            color: a.status === "ACKNOWLEDGED" ? "#bfdbfe" : "#bbf7d0",
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "1px"
                                        }}>
                                            {a.status}
                                        </div>
                                    )}
                                </div>

                                {/* ACTION BUTTONS */}
                                {isOpen && (
                                    <div style={{
                                        display: "flex",
                                        gap: "12px",
                                        marginTop: "20px",
                                        paddingTop: "20px",
                                        borderTop: "1px solid #334155"
                                    }}>
                                        <button
                                            onClick={() => acknowledge(a.alert_id)}
                                            style={{
                                                padding: "12px 24px",
                                                backgroundColor: "#1e40af",
                                                color: "white",
                                                border: "1px solid #3b82f6",
                                                borderRadius: "6px",
                                                fontSize: "0.9rem",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px"
                                            }}
                                        >
                                            Acknowledge & Get Advice
                                        </button>
                                        <button
                                            onClick={() => resolve(a.alert_id)}
                                            style={{
                                                padding: "12px 24px",
                                                backgroundColor: "transparent",
                                                color: "#94a3b8",
                                                border: "1px solid #475569",
                                                borderRadius: "6px",
                                                fontSize: "0.9rem",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px"
                                            }}
                                        >
                                            Resolve
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}