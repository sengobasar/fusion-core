import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import { useTranslation } from "../hooks/useTranslation";
import { LANG_LABELS } from "../i18n/dictionary";
import type { Language } from "../i18n/dictionary";

// Keep IDs internal, but we will use keys for labels now
const EVENT_TYPES = [
  { id: "THREAD_BREAK", labelKey: "THREAD_BREAK", color: "#f59e0b" },
  { id: "NO_MATERIAL", labelKey: "NO_MATERIAL", color: "#ef4444" },
  { id: "NO_ORDER", labelKey: "NO_ORDER", color: "#f97316" },
  { id: "RESUME", labelKey: "RESUME", color: "#22c55e" },
];

export default function WorkerView() {
  const { t, lang, setLang } = useTranslation();
  const [houseId, setHouseId] = useState<string | null>(localStorage.getItem("house_id"));
  const [activeHouses, setActiveHouses] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    if (!houseId) {
      dbPromise.then(async (db) => {
        const houses = await db.getAll("houses");
        setActiveHouses(houses.filter((h: any) => h.active).map((h: any) => h.house_id));
      });
    } else {
      restoreState();
    }
  }, [houseId]);

  async function restoreState() {
    const db = await dbPromise;
    const allEvents = await db.getAll("events");
    const houseEvents = allEvents
      .filter((e: any) => e.house_id === houseId)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (houseEvents.length > 0) {
      setLastEvent(houseEvents[0].event_type);
    }
  }

  async function handleSelectHouse(id: string) {
    localStorage.setItem("house_id", id);
    setHouseId(id);
  }

  async function logEvent(eventType: string) {
    if (!houseId) return;
    const db = await dbPromise;

    await db.put("events", {
      event_id: crypto.randomUUID(),
      house_id: houseId,
      order_id: "ORD-001",
      event_type: eventType, // INTERNAL KEY ONLY
      timestamp: new Date().toISOString(),
      source: "PWA",
    });

    setLastEvent(eventType);
  }

  // Language Switcher Component
  const LanguageSelector = () => (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Language)}
      style={{ padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", marginLeft: "auto" }}
    >
      {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
        <option key={l} value={l}>{LANG_LABELS[l]}</option>
      ))}
    </select>
  );

  // 1. SELECT HOUSE SCREEN
  if (!houseId) {
    return (
      <div style={{ padding: "var(--space-lg)", maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
        <div className="flex-row" style={{ justifyContent: "flex-end", marginBottom: "var(--space-md)" }}>
          <LanguageSelector />
        </div>

        <h2 style={{ marginBottom: "var(--space-md)" }}>{t("SELECT_HOUSE")}</h2>
        <div className="flex-col gap-md">
          {activeHouses.length === 0 && <p>{t("NO_HOUSES_FOUND")}</p>}
          {activeHouses.map(id => (
            <button
              key={id}
              onClick={() => handleSelectHouse(id)}
              style={{
                padding: "20px",
                fontSize: "1.25rem",
                fontWeight: "bold",
                backgroundColor: "white",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. OPERATOR INTERFACE
  const isProduction = !lastEvent || lastEvent === "RESUME";
  const currentIssue = !isProduction ? EVENT_TYPES.find(e => e.id === lastEvent) : null;
  // Fallback for issue label if not found in list (e.g. legacy data)
  const issueLabel = currentIssue ? t(currentIssue.labelKey as any) : lastEvent;

  return (
    <div style={{ padding: "var(--space-md)", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* HEADER WITH LANG SWITCHER */}
      <div className="flex-row" style={{ marginBottom: "var(--space-md)", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 600 }}>{t("APP_TITLE")}</div>
        <LanguageSelector />
      </div>

      {/* STATUS HEADER */}
      <div
        className="card"
        style={{
          marginBottom: "var(--space-lg)",
          textAlign: "center",
          backgroundColor: isProduction ? "#f0fdf4" : "#fef2f2",
          borderColor: isProduction ? "#bbf7d0" : "#fecaca",
          padding: "var(--space-lg)"
        }}
      >
        <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "4px" }}>
          {t("CONNECTED_TO")} {houseId}
        </div>
        <div style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: isProduction ? "#166534" : "#991b1b"
        }}>
          {isProduction ? t("STATUS_RUNNING") : `${t("STATUS_ISSUE")}: ${issueLabel}`}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex-col gap-md" style={{ flex: 1 }}>
        {EVENT_TYPES.map((type) => {
          const isResume = type.id === "RESUME";
          if (isProduction && isResume) return null;
          if (!isProduction && !isResume) return null;

          return (
            <button
              key={type.id}
              onClick={() => logEvent(type.id)}
              style={{
                flex: 1,
                maxHeight: "120px",
                // Use light background for Resume to be distinct? Or keep consistent?
                // Prompt said "Buttons must be large, high-contrast".
                background: type.id === "RESUME" ? "#22c55e" : "white",
                color: type.id === "RESUME" ? "white" : type.color,
                border: `2px solid ${type.color}`,

                borderRadius: "var(--radius-lg)",
                fontSize: "1.5rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
              }}
            >
              {t(type.labelKey as any)}
            </button>
          );
        })}

        {!isProduction && (
          <div style={{ marginTop: "auto", textAlign: "center" }}>
            <p className="text-sm">
              <span
                style={{ textDecoration: "underline", cursor: "pointer" }}
                onClick={() => setLastEvent(null)}
              >
                {t("MISTAKE_CANCEL")}
              </span>
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: "var(--space-lg)", textAlign: "center" }}>
        <button
          onClick={() => { localStorage.removeItem("house_id"); setHouseId(null); }}
          style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "0.875rem" }}
        >
          {t("UNLINK")}
        </button>
      </div>
    </div>
  );
}
