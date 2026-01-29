type HouseCardProps = {
    houseId: string;
    cluster?: string;
    active: boolean;

    status: "RUNNING" | "INTERRUPTED" | "INACTIVE";

    idleMinutes: number;
    workedMinutes: number;

    dominantIssue?: string;
};

export default function HouseCard({
    houseId,
    cluster,
    active,
    status,
    idleMinutes,
    workedMinutes,
    dominantIssue,
}: HouseCardProps) {
    return (
        <div className="card" style={{ padding: "var(--space-md)" }}>

            {/* Header */}
            <div className="flex-row" style={{ justifyContent: "space-between" }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{houseId}</div>
                    <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {cluster || "Unassigned"}
                    </div>
                </div>

                <span
                    style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background:
                            status === "RUNNING"
                                ? "#dcfce7"
                                : status === "INTERRUPTED"
                                    ? "#fee2e2"
                                    : "#e5e7eb",
                        color:
                            status === "RUNNING"
                                ? "#166534"
                                : status === "INTERRUPTED"
                                    ? "#991b1b"
                                    : "#374151",
                    }}
                >
                    {status}
                </span>
            </div>

            {/* Body */}
            <div className="flex-row" style={{ marginTop: "12px", gap: "16px" }}>
                <div>
                    <div className="text-sm">Worked</div>
                    <div style={{ fontWeight: 600 }}>{workedMinutes} min</div>
                </div>

                <div>
                    <div className="text-sm">Idle</div>
                    <div style={{ fontWeight: 600 }}>{idleMinutes} min</div>
                </div>
            </div>

            {/* Footer */}
            {dominantIssue && (
                <div
                    className="text-sm"
                    style={{
                        marginTop: "12px",
                        padding: "6px 8px",
                        background: "#f8fafc",
                        borderRadius: "6px",
                    }}
                >
                    Dominant Issue: <strong>{dominantIssue}</strong>
                </div>
            )}

            {!active && (
                <div
                    className="text-sm"
                    style={{
                        marginTop: "8px",
                        color: "#64748b",
                        fontStyle: "italic",
                    }}
                >
                    House inactive
                </div>
            )}
        </div>
    );
}
