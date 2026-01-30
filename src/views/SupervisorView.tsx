import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import { pairEvents } from "../utils/pairEvents";
import { groupWindows } from "../utils/groupWindows";
import { checkThresholds } from "../utils/checkThresholds";
import { checkOpenWindows } from "../utils/checkOpenWindows";
import type { Signal } from "../types/signal";
import type { Action } from "../types/action";
import { buildSignals } from "../utils/buildSignals";
import { buildActions } from "../utils/buildActions";
import {
  buildImpactComparison,
  IMPACT_DISCLAIMER,
} from "../utils/impactFormula";
import {
  buildPredictiveSignals,
} from "../utils/predictiveSignals";
import {
  buildPredictiveInsights,
  type PredictiveInsight,
} from "../utils/predictiveInsights";
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

type Alert = {
  house_id: string;
  type: string;
  reason: string;
  durationMinutes: number;
};

/* ================= VIEW ================= */

export default function SupervisorView() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [houseStats, setHouseStats] = useState<Record<string, any>>({});
  const [houseCardsData, setHouseCardsData] = useState<any[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [actions, setActions] = useState<Action[]>([]);

  const [impact, setImpact] = useState<any>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
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

    /* -------- Group events by house -------- */
    // SORT EVENTS DESCENDING (Newest First) to ensure logic works
    allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const eventsByHouse: Record<string, EventRecord[]> = {};
    for (const e of allEvents) {
      if (!eventsByHouse[e.house_id]) eventsByHouse[e.house_id] = [];
      eventsByHouse[e.house_id].push(e);
    }

    const allAlerts: Alert[] = [];
    const houseDowntime: Record<string, Record<string, number>> = {};
    const issueCounts: Record<string, number> = {};
    let maxDuration = 0;
    let currentlyInterruptedCount = 0;
    const cards: any[] = [];

    /* -------- PER HOUSE -------- */
    for (const house of allHouses) {
      const houseEvents = eventsByHouse[house.house_id] || [];

      // Determine Status
      const isInterrupted = houseEvents.length > 0 && houseEvents[0].event_type !== "RESUME";
      let status: "RUNNING" | "INTERRUPTED" | "INACTIVE" = "RUNNING";
      if (!house.active) status = "INACTIVE";
      else if (isInterrupted) status = "INTERRUPTED";

      if (house.active && isInterrupted) {
        currentlyInterruptedCount++;
      }

      const windows = pairEvents(houseEvents);
      const grouped = groupWindows(windows);
      houseDowntime[house.house_id] = grouped;

      // Layer 3 inputs
      allAlerts.push(...checkThresholds(house.house_id, windows));
      const openAlert = checkOpenWindows(house.house_id, houseEvents)[0];
      if (openAlert) {
        allAlerts.push(openAlert);
      }

      // Summary tracking
      for (const w of windows) {
        issueCounts[w.type] = (issueCounts[w.type] || 0) + 1;
        if (w.durationMinutes > maxDuration) {
          maxDuration = w.durationMinutes;
        }
      }

      const start = (houseEvents.length > 0 && isInterrupted) ? new Date(houseEvents[0].timestamp).getTime() : 0;
      if (start > 0) {
        const duration = Math.round((Date.now() - start) / 60000);
        if (duration > maxDuration) maxDuration = duration;
      }

      const idleMinutes = Object.values(grouped).reduce(
        (a: number, b: number) => a + b,
        0
      );

      const workedMinutes = Math.max(
        0,
        DAILY_AVAILABLE_MINUTES - idleMinutes
      );

      const dominantIssue =
        Object.entries(grouped).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];

      cards.push({
        houseId: house.cost_center || house.house_id,
        cluster: house.ward || house.cluster_id,
        active: house.active, // Pass correct Active state
        status,               // Pass correct Status
        idleMinutes,
        workedMinutes,
        dominantIssue:
          dominantIssue ? ISSUE_TO_ERP_LOSS[dominantIssue] : "None",
      });
    }

    /* -------- LAYER 3 -------- */
    const builtSignals = buildSignals(allAlerts);

    /* -------- LAYER 4 -------- */
    const builtActions = buildActions(builtSignals);

    /* -------- LAYER 5 -------- */
    const totalDowntimeMinutes = Object.values(houseDowntime).reduce(
      (sum: number, perHouse: any) =>
        sum +
        Object.values(perHouse as Record<string, number>).reduce(
          (a: number, b: number) => a + b,
          0
        ),
      0
    );

    const impactComparison = buildImpactComparison(
      totalDowntimeMinutes,
      DAILY_AVAILABLE_MINUTES
    );

    /* -------- LAYER 6 — PREDICTIVE (Rule-based) -------- */

    // Build issue count per house
    const issueCountsByHouse: Record<string, Record<string, number>> = {};

    for (const [houseId, grouped] of Object.entries(houseDowntime)) {
      issueCountsByHouse[houseId] = {};
      for (const [issue, minutes] of Object.entries(grouped)) {
        if (minutes > 0) {
          issueCountsByHouse[houseId][issue] =
            (issueCountsByHouse[houseId][issue] || 0) + 1;
        }
      }
    }

    const predictiveSignals = buildPredictiveSignals(issueCountsByHouse);
    const insights = buildPredictiveInsights(predictiveSignals);

    setPredictiveInsights(insights);

    /* -------- Summary -------- */
    let topIssue = "None";
    let topCount = 0;
    for (const [issue, count] of Object.entries(issueCounts)) {
      if (count > topCount) {
        topCount = count;
        topIssue = issue;
      }
    }

    setSummary({
      totalHouses: allHouses.filter((h: any) => h.active).length,
      activeInteractions: currentlyInterruptedCount, // ✅ FIXED
      longestInterruption: maxDuration,
      mostFrequentIssue: ISSUE_TO_ERP_LOSS[topIssue] ?? topIssue,
    });

    setSignals(builtSignals);
    setActions(builtActions);
    setHouseStats(houseDowntime);
    setHouseCardsData(cards);
    setImpact(impactComparison);
    setEvents(allEvents);
  }

  /* ================= RENDER ================= */

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>Production Overview</h2>

      <section style={{ marginBottom: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
          <MetricCard label="Active Houses" value={summary.totalHouses} />
          <MetricCard label="Currently Interrupted" value={summary.activeInteractions} />
          <MetricCard label="Longest Interruption" value={`${summary.longestInterruption} min`} />
          <MetricCard label="Most Frequent Issue" value={summary.mostFrequentIssue} />
        </div>
      </section>

      {impact && (
        <section style={{ marginBottom: "32px" }}>
          <h3>Operational Impact (Illustrative)</h3>
          <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>{IMPACT_DISCLAIMER}</p>
          <ul>
            <li>Before FloorSight: {impact.before.lostMinutes} min ({impact.before.mandaysLost.toFixed(2)} mandays)</li>
            <li>After FloorSight: {impact.after.lostMinutes} min ({impact.after.mandaysLost.toFixed(2)} mandays)</li>
            <li>Improvement: {impact.improvementMinutes} min ({impact.improvementMandays.toFixed(2)} mandays)</li>
            <li>Direction: {impact.direction === "UP" ? "↑ Improvement" : "— No change"}</li>
          </ul>
        </section>
      )}

      {actions.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <h3>Suggested Actions (Advisory)</h3>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            These are advisory suggestions. No action is automated.
          </p>
          <ul>
            {actions.map(a => (
              <li key={a.id}>
                🔸 <strong>{a.title}</strong> ({a.priority}) — {a.description}
                <br />
                <em>Reason:</em> {a.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {signals.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <h3>Attention Signals</h3>
          <ul>
            {signals.map((s, i) => (
              <li key={i}>
                ⚠ {s.type} — {s.houseId} ({s.durationMinutes} min, {s.severity})
              </li>
            ))}
          </ul>
        </section>
      )}

      {predictiveInsights.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <h3>Predictive Insights (Rule-based)</h3>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            Forward-looking insights derived from recent patterns. No automation.
          </p>
          <ul>
            {predictiveInsights.map((p, i) => (
              <li key={i}>
                🔮 <strong>{p.houseId}</strong> — {p.message} ({p.confidence})
              </li>
            ))}
          </ul>
        </section>
      )}

      <h3>House Status</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
        {houseCardsData.map(h => (
          <HouseCard key={h.houseId} {...h} />
        ))}
      </div>


      <section style={{ marginBottom: "var(--space-xl)", marginTop: "32px" }}>
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
    </div >
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

/* ================= UI HELPERS ================= */

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
