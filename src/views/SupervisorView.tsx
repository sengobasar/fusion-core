import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import { pairEvents } from "../utils/pairEvents";
import { groupWindows } from "../utils/groupWindows";
import { checkOpenWindows } from "../utils/checkOpenWindows";
import HouseCard from "../components/HouseCard";
import { ISSUE_TO_ERP_LOSS } from "../erp/erpMapping";
import { DAILY_AVAILABLE_MINUTES } from "../config/capacity";

/* ================= TYPES ================= */

type EventRecord = {
  event_id: string;
  house_id: string;
  order_id: string;
  event_type: string;
  timestamp: string;
};

/* ================= VIEW ================= */

export default function SupervisorView() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [houseStats, setHouseStats] = useState<Record<string, any>>({});
  const [houseCardsData, setHouseCardsData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalHouses: 0,
    activeInteractions: 0,
    longestInterruption: 0,
    mostFrequentIssue: "None",
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    const db = await dbPromise;
    const allEvents: EventRecord[] = await db.getAll("events");
    const allHouses = await db.getAll("houses");

    const activeHouseIds = new Set(
      allHouses.filter((h: any) => h.active).map((h: any) => h.house_id)
    );

    allEvents.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setEvents(allEvents);

    const eventsByHouse: Record<string, EventRecord[]> = {};
    for (const e of allEvents) {
      if (!eventsByHouse[e.house_id]) eventsByHouse[e.house_id] = [];
      eventsByHouse[e.house_id].push(e);
    }

    const houseDowntime: Record<string, Record<string, number>> = {};
    const issueCounts: Record<string, number> = {};
    let currentIntervenedCount = 0;
    let maxDuration = 0;

    const cards: any[] = [];

    for (const house of allHouses) {
      const houseId = house.house_id;
      const houseEvents = eventsByHouse[houseId] || [];

      const windows = pairEvents(houseEvents);
      const grouped = groupWindows(windows);
      houseDowntime[houseId] = grouped;

      const openAlert = checkOpenWindows(houseId, houseEvents)[0];

      if (
        houseEvents.length > 0 &&
        houseEvents[0].event_type !== "RESUME" &&
        house.active
      ) {
        currentIntervenedCount++;
        const start = new Date(houseEvents[0].timestamp).getTime();
        const duration = Math.round((Date.now() - start) / 60000);
        if (duration > maxDuration) maxDuration = duration;
      }

      for (const w of windows) {
        issueCounts[w.type] = (issueCounts[w.type] || 0) + 1;
        if (w.durationMinutes > maxDuration) {
          maxDuration = w.durationMinutes;
        }
      }

      /* ===== TIME MATH (STEP 2) ===== */

      const idleMinutes = Object.values(grouped).reduce(
        (a: any, b: any) => a + b,
        0
      );

      const availableMinutes = DAILY_AVAILABLE_MINUTES;
      const workedMinutes = Math.max(0, availableMinutes - idleMinutes);

      const utilization =
        availableMinutes > 0
          ? workedMinutes / availableMinutes
          : 0;

      const mandays = workedMinutes / DAILY_AVAILABLE_MINUTES;

      let status: "RUNNING" | "INTERRUPTED" | "INACTIVE" = "RUNNING";
      if (!house.active) status = "INACTIVE";
      else if (openAlert) status = "INTERRUPTED";

      const dominantIssueRaw =
        Object.entries(grouped).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];

      cards.push({
        houseId: house.house_id,                 // cost_center_id
        cluster: house.ward || house.cluster_id, // org_unit
        active: house.active,
        status,
        idleMinutes,
        workedMinutes,
        utilization, // 0–1
        mandays,     // capacity equivalent
        dominantIssue: dominantIssueRaw
          ? ISSUE_TO_ERP_LOSS[dominantIssueRaw] ?? dominantIssueRaw
          : "None",
      });
    }

    let topIssue = "None";
    let topCount = 0;
    for (const [issue, count] of Object.entries(issueCounts)) {
      if (count > topCount) {
        topCount = count;
        topIssue = issue;
      }
    }

    setHouseStats(houseDowntime);
    setHouseCardsData(cards);
    setSummary({
      totalHouses: activeHouseIds.size,
      activeInteractions: currentIntervenedCount,
      longestInterruption: maxDuration,
      mostFrequentIssue: ISSUE_TO_ERP_LOSS[topIssue] ?? topIssue,
    });
  }

  return (
    <div style={{ padding: "var(--space-lg)", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>Production Overview</h2>

      <section style={{ marginBottom: "var(--space-xl)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
          <MetricCard label="Active Houses" value={summary.totalHouses} />
          <MetricCard label="Currently Interrupted" value={summary.activeInteractions} />
          <MetricCard label="Longest Interruption" value={`${summary.longestInterruption} min`} />
          <MetricCard label="Most Frequent Issue" value={summary.mostFrequentIssue} />
        </div>
      </section>

      <section style={{ marginBottom: "var(--space-xl)" }}>
        <h3>House Status</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-md)" }}>
          {houseCardsData.map((h, i) => (
            <HouseCard key={i} {...h} />
          ))}
        </div>
      </section>

      {/* DOWNTIME */}
      <section style={{ marginBottom: "var(--space-xl)" }}>
        <h3>Downtime Analysis (Today)</h3>
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

      {/* EVENT LOG */}
      <section>
        <h3>Recent Event Log</h3>
        <div className="card" style={{ maxHeight: "300px", overflowY: "auto" }}>
          <table style={{ width: "100%", fontSize: "0.875rem" }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>House</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 50).map((e) => (
                <tr key={e.event_id}>
                  <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td>{e.house_id}</td>
                  <td>{e.event_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ================= UI HELPERS ================= */

/* ================= UI HELPERS ================= */

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <div className="text-sm">{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
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
