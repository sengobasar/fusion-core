import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import {
    buildAdvisoryActions,
    type AdvisoryAction,
} from "../utils/advisoryRules";

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAdvisory();

        // 🔁 Poll every 5 seconds (same philosophy as SupervisorView)
        const interval = setInterval(loadAdvisory, 5000);
        return () => clearInterval(interval);
    }, []);

    async function loadAdvisory() {
        const db = await dbPromise;

        const allAlerts: Alert[] = await db.getAll("alerts");

        // ✅ Advisory is based on ACKNOWLEDGED alerts
        const acknowledgedAlerts = allAlerts.filter(
            (a) => a.status === "ACKNOWLEDGED"
        );

        const advisoryActions = buildAdvisoryActions(acknowledgedAlerts);
        setActions(advisoryActions);
        setLoading(false);
    }

    /* ================= DERIVED DATA ================= */
    const actionsByPriority = {
        HIGH: actions.filter(a => a.priority === "HIGH"),
        MEDIUM: actions.filter(a => a.priority === "MEDIUM"),
        LOW: actions.filter(a => a.priority === "LOW"),
    };

    const highCount = actionsByPriority.HIGH.length;
    const mediumCount = actionsByPriority.MEDIUM.length;
    const lowCount = actionsByPriority.LOW.length;

    /* ================= RENDER ================= */

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#1e293b",
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
                        Recommended Actions
                    </h1>
                    <p style={{
                        color: "#94a3b8",
                        margin: 0,
                        fontSize: "0.95rem"
                    }}>
                        Human-driven interventions based on acknowledged alerts. No action is automated.
                    </p>
                </div>

                {/* SUMMARY STRIP */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                    marginBottom: "32px"
                }}>
                    <div style={{
                        backgroundColor: "#0f172a",
                        padding: "24px",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1.5px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            High Priority
                        </div>
                        <div style={{
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            color: "#ef4444"
                        }}>
                            {highCount}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: "#0f172a",
                        padding: "24px",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1.5px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            Medium Priority
                        </div>
                        <div style={{
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            color: "#f59e0b"
                        }}>
                            {mediumCount}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: "#0f172a",
                        padding: "24px",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}>
                        <div style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1.5px",
                            fontWeight: 600,
                            marginBottom: "8px"
                        }}>
                            Low Priority
                        </div>
                        <div style={{
                            fontSize: "2.5rem",
                            fontWeight: 700,
                            color: "#64748b"
                        }}>
                            {lowCount}
                        </div>
                    </div>
                </div>

                {/* HORIZONTAL LINE SEPARATOR */}
                <div style={{
                    height: "1px",
                    backgroundColor: "#334155",
                    marginBottom: "32px"
                }} />

                {/* LOADING STATE */}
                {loading && (
                    <div style={{
                        backgroundColor: "#0f172a",
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
                            Loading advisory actions…
                        </p>
                    </div>
                )}

                {/* EMPTY STATE */}
                {!loading && actions.length === 0 && (
                    <div style={{
                        backgroundColor: "#0f172a",
                        padding: "60px 32px",
                        borderRadius: "8px",
                        textAlign: "center",
                        border: "1px solid #334155"
                    }}>
                        <div style={{
                            fontSize: "2.5rem",
                            marginBottom: "16px",
                            color: "#22c55e"
                        }}>
                            ✓
                        </div>
                        <p style={{
                            color: "#64748b",
                            fontSize: "1.1rem",
                            margin: 0
                        }}>
                            No pending actions at the moment
                        </p>
                        <p style={{
                            color: "#475569",
                            fontSize: "0.9rem",
                            margin: "8px 0 0 0"
                        }}>
                            All acknowledged alerts have been processed
                        </p>
                    </div>
                )}

                {/* ACTION CARDS - GROUPED BY PRIORITY */}
                {!loading && actions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

                        {/* HIGH PRIORITY SECTION */}
                        {actionsByPriority.HIGH.length > 0 && (
                            <section>
                                <div style={{
                                    marginBottom: "20px",
                                    paddingBottom: "12px",
                                    borderBottom: "1px solid #334155"
                                }}>
                                    <h2 style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 700,
                                        color: "#ef4444",
                                        margin: 0,
                                        letterSpacing: "0.5px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px"
                                    }}>
                                        <span>🔴</span>
                                        High Priority Actions
                                        <span style={{
                                            fontSize: "0.9rem",
                                            color: "#64748b",
                                            fontWeight: 500
                                        }}>
                                            ({actionsByPriority.HIGH.length})
                                        </span>
                                    </h2>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {actionsByPriority.HIGH.map(action => (
                                        <ActionCard key={action.alertId} action={action} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* MEDIUM PRIORITY SECTION */}
                        {actionsByPriority.MEDIUM.length > 0 && (
                            <section>
                                <div style={{
                                    marginBottom: "20px",
                                    paddingBottom: "12px",
                                    borderBottom: "1px solid #334155"
                                }}>
                                    <h2 style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 700,
                                        color: "#f59e0b",
                                        margin: 0,
                                        letterSpacing: "0.5px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px"
                                    }}>
                                        <span>🟡</span>
                                        Medium Priority Actions
                                        <span style={{
                                            fontSize: "0.9rem",
                                            color: "#64748b",
                                            fontWeight: 500
                                        }}>
                                            ({actionsByPriority.MEDIUM.length})
                                        </span>
                                    </h2>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {actionsByPriority.MEDIUM.map(action => (
                                        <ActionCard key={action.alertId} action={action} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* LOW PRIORITY SECTION */}
                        {actionsByPriority.LOW.length > 0 && (
                            <section>
                                <div style={{
                                    marginBottom: "20px",
                                    paddingBottom: "12px",
                                    borderBottom: "1px solid #334155"
                                }}>
                                    <h2 style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 700,
                                        color: "#64748b",
                                        margin: 0,
                                        letterSpacing: "0.5px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px"
                                    }}>
                                        <span>⚪</span>
                                        Low Priority Actions
                                        <span style={{
                                            fontSize: "0.9rem",
                                            color: "#64748b",
                                            fontWeight: 500
                                        }}>
                                            ({actionsByPriority.LOW.length})
                                        </span>
                                    </h2>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {actionsByPriority.LOW.map(action => (
                                        <ActionCard key={action.alertId} action={action} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ================= ACTION CARD COMPONENT ================= */

function ActionCard({ action }: { action: AdvisoryAction }) {
    const isHigh = action.priority === "HIGH";
    const isMedium = action.priority === "MEDIUM";


    const borderColor = isHigh ? "#ef4444" : isMedium ? "#f59e0b" : "#64748b";
    const bgColor = isHigh ? "#7f1d1d" : isMedium ? "#78350f" : "#1e293b";
    const textColor = isHigh ? "#fecaca" : isMedium ? "#fde68a" : "#94a3b8";

    return (
        <div style={{
            backgroundColor: "#0f172a",
            border: `1px solid ${borderColor}`,
            borderRadius: "8px",
            padding: "24px",
            paddingLeft: "28px",
            borderLeft: `6px solid ${borderColor}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px"
            }}>
                <div style={{ flex: 1 }}>
                    {/* PRIORITY BADGE */}
                    <div style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        backgroundColor: bgColor,
                        color: textColor,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "12px"
                    }}>
                        {action.priority} PRIORITY
                    </div>

                    {/* TITLE */}
                    <h3 style={{
                        margin: 0,
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        color: "white",
                        marginBottom: "8px",
                        letterSpacing: "0.5px"
                    }}>
                        {action.title}
                    </h3>

                    {/* MACHINE INFO */}
                    <div style={{
                        fontSize: "0.85rem",
                        color: "#64748b",
                        marginBottom: "12px"
                    }}>
                        Machine: <span style={{ fontWeight: 600, color: "#cbd5e1" }}>{action.house_id}</span>
                    </div>

                    {/* DESCRIPTION */}
                    <div style={{
                        fontSize: "1rem",
                        color: "#cbd5e1",
                        lineHeight: 1.6,
                        marginBottom: "12px"
                    }}>
                        {action.description}
                    </div>

                    {/* TRIGGER INFO */}
                    <div style={{
                        fontSize: "0.8rem",
                        color: "#64748b",
                        fontStyle: "italic"
                    }}>
                        Triggered by: {action.issue}
                    </div>
                </div>

                {/* CHECKLIST ICON */}
                <div style={{
                    marginLeft: "20px",
                    padding: "12px",
                    backgroundColor: "#1e293b",
                    borderRadius: "8px",
                    border: "1px solid #334155"
                }}>
                    <div style={{
                        fontSize: "1.5rem"
                    }}>
                        📋
                    </div>
                </div>
            </div>
        </div>
    );
}