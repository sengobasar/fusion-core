import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import { pairEvents } from "../utils/pairEvents";
import { groupWindows } from "../utils/groupWindows";
import { checkThresholds } from "../utils/checkThresholds";
import { checkOpenWindows } from "../utils/checkOpenWindows";

type EventRecord = {
  event_id: string;
  house_id: string;
  order_id: string;
  event_type: string;
  timestamp: string;
};

type Alert = {
  house_id: string;
  type: string;
  reason: string;
  durationMinutes: number;
};

export default function SupervisorView() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [houseStats, setHouseStats] = useState<Record<string, any>>({});
  const [summary, setSummary] = useState({
    totalHouses: 0,
    activeInteractions: 0,
    longestInterruption: 0,
    mostFrequentIssue: "None"
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    const db = await dbPromise;
    const allEvents: EventRecord[] = await db.getAll("events");
    const allHouses = await db.getAll("houses");
    const activeHouseIds = new Set(allHouses.filter((h: any) => h.active).map((h: any) => h.house_id));

    // Sort events
    allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setEvents(allEvents);

    // Group by house
    const eventsByHouse: Record<string, EventRecord[]> = {};
    for (const e of allEvents) {
      if (!eventsByHouse[e.house_id]) eventsByHouse[e.house_id] = [];
      eventsByHouse[e.house_id].push(e);
    }

    const calculatedAlerts: Alert[] = [];
    const houseDowntime: Record<string, Record<string, number>> = {};
    let currentIntervenedCount = 0;
    let maxDuration = 0;
    const issueCounts: Record<string, number> = {};

    // Process each house
    for (const houseId of activeHouseIds) {
      const houseEvents = eventsByHouse[houseId as string] || [];
      // 1. History Analysis
      const windows = pairEvents(houseEvents);
      const grouped = groupWindows(windows);
      houseDowntime[houseId as string] = grouped;

      // 2. Alert Checks (Historical)
      calculatedAlerts.push(...checkThresholds(houseId as string, windows));

      // 3. Current Status Checks (Open Windows)
      const currentAlerts = checkOpenWindows(houseId as string, houseEvents);
      calculatedAlerts.push(...currentAlerts);

      // 4. Metrics
      if (houseEvents.length > 0 && houseEvents[0].event_type !== "RESUME") {
        currentIntervenedCount++;

        const start = new Date(houseEvents[0].timestamp).getTime();
        const duration = Math.round((Date.now() - start) / 60000);
        if (duration > maxDuration) maxDuration = duration;
      }

      for (const w of windows) {
        issueCounts[w.type] = (issueCounts[w.type] || 0) + 1;
        if (w.durationMinutes > maxDuration) maxDuration = w.durationMinutes;
      }
    }

    let topIssue = "None";
    let topCount = 0;
    for (const [issue, count] of Object.entries(issueCounts)) {
      if (count > topCount) {
        topCount = count;
        topIssue = issue;
      }
    }

    setAlerts(calculatedAlerts);
    setHouseStats(houseDowntime);
    setSummary({
      totalHouses: activeHouseIds.size,
      activeInteractions: currentIntervenedCount,
      longestInterruption: maxDuration,
      mostFrequentIssue: topIssue
    });
  }

  return (
    <div style={{ padding: "var(--space-lg)", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-lg)" }}>
        <div>
          <h2 style={{ marginBottom: "var(--space-xs)" }}>Production Overview</h2>
          <p className="text-sm">Real-time status of weaving cluster.</p>
        </div>
        <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {new Date().toLocaleDateString()}
        </div>
      </div>

      <section style={{ marginBottom: "var(--space-xl)" }}>
        <h3 className="text-lg">Critical Alerts</h3>
        <div className="flex-col gap-sm">
          {alerts.length === 0 && (
            <div style={{ padding: "var(--space-md)", background: "#f0fdf4", borderRadius: "var(--radius-md)", color: "#166534", border: "1px solid #bbf7d0" }}>
              No active critical alerts. Systems nominal.
            </div>
          )}
          {alerts.map((a, idx) => {
            const isSever = a.durationMinutes > 60 || a.type === "NO_MATERIAL";
            return (
              <div key={idx}
                className="card flex-row"
                style={{
                  justifyContent: "space-between",
                  borderLeft: `4px solid ${isSever ? "var(--color-critical)" : "var(--color-warning)"}`
                }}
              >
                <div className="flex-row gap-md">
                  <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{a.house_id}</span>
                  <span style={{ padding: "2px 8px", borderRadius: "12px", background: "#f3f4f6", fontSize: "0.8rem", fontWeight: 600 }}>{a.type}</span>
                  <span>{a.reason}</span>
                </div>
                <div style={{ fontWeight: 600, color: isSever ? "var(--color-critical)" : "var(--color-warning)" }}>
                  {a.durationMinutes} min
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: "var(--space-xl)" }}>
        <h3 className="text-lg">Execution Snapshot</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-md)" }}>
          <MetricCard label="Active Houses" value={summary.totalHouses} />
          <MetricCard label="Currently Interrupted" value={summary.activeInteractions} highlight={summary.activeInteractions > 0} />
          <MetricCard label="Longest Interruption" value={`${summary.longestInterruption} min`} />
          <MetricCard label="Most Frequent Issue" value={summary.mostFrequentIssue} />
        </div>
      </section>

      <section style={{ marginBottom: "var(--space-xl)" }}>
        <h3 className="text-lg">Downtime Analysis (Today)</h3>
        <div className="card" style={{ padding: "var(--space-lg)" }}>
          {Object.keys(houseStats).length === 0 && <p style={{ fontStyle: "italic" }}>No downtime recorded today.</p>}

          {Object.entries(houseStats).map(([hid, stats]: [string, any]) => {
            const total = Object.values(stats).reduce((a: any, b: any) => a + b, 0) as number;
            return (
              <div key={hid} style={{ marginBottom: "var(--space-md)" }}>
                <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, width: "60px" }}>{hid}</span>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{total} min total</span>
                </div>
                <div style={{ height: "24px", width: "100%", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
                  {Object.entries(stats).map(([type, mins]: [string, any]) => {
                    const width = Math.max(2, (mins / (total || 1)) * 100);
                    let color = "#94a3b8";
                    if (type === "NO_MATERIAL") color = "#ef4444";
                    if (type === "THREAD_BREAK") color = "#f59e0b";
                    if (type === "NO_ORDER") color = "#f97316";

                    return (
                      <div key={type} style={{ width: `${width}%`, background: color }} title={`${type}: ${mins}m`} />
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex-row gap-md" style={{ marginTop: "var(--space-md)", justifyContent: "center", fontSize: "0.75rem" }}>
            <LegendColor color="#ef4444" label="No Material" />
            <LegendColor color="#f59e0b" label="Thread Break" />
            <LegendColor color="#f97316" label="No Order" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg">Recent Event Log</h3>
        <div className="card" style={{ maxHeight: "300px", overflowY: "auto", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
              <tr>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>Time</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>House</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>Event</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 50).map(e => (
                <tr key={e.event_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px" }}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: "12px", fontWeight: 600 }}>{e.house_id}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: e.event_type === "RESUME" ? "#dcfce7" : "#fee2e2",
                      color: e.event_type === "RESUME" ? "#166534" : "#991b1b",
                      fontWeight: 500
                    }}>
                      {e.event_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className="card">
      <div className="text-sm" style={{ color: "var(--color-text-secondary)", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: highlight ? "var(--color-critical)" : "var(--color-text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

function LegendColor({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex-row gap-sm">
      <div style={{ width: "12px", height: "12px", background: color, borderRadius: "2px" }} />
      <span>{label}</span>
    </div>
  );
}
