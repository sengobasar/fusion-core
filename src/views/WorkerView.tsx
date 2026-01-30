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
      event_type: eventType,
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
      style={{
        padding: "10px 14px",
        borderRadius: "6px",
        border: "1px solid #cbd5e1",
        fontSize: "0.875rem",
        backgroundColor: "white",
        color: "#475569",
        cursor: "pointer",
        fontWeight: 500
      }}
    >
      {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
        <option key={l} value={l}>{LANG_LABELS[l]}</option>
      ))}
    </select>
  );

  // 1. SELECT HOUSE SCREEN
  if (!houseId) {
    return (
      <div style={{
        padding: "24px",
        maxWidth: "500px",
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f1f5f9"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "48px"
        }}>
          <h2 style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#0f172a"
          }}>
            {t("SELECT_HOUSE")}
          </h2>
          <LanguageSelector />
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {activeHouses.length === 0 && (
            <p style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "1.1rem",
              marginTop: "60px"
            }}>
              {t("NO_HOUSES_FOUND")}
            </p>
          )}
          {activeHouses.map(id => (
            <button
              key={id}
              onClick={() => handleSelectHouse(id)}
              style={{
                padding: "28px",
                fontSize: "1.75rem",
                fontWeight: 700,
                backgroundColor: "#0f172a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                letterSpacing: "2px"
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
  const issueLabel = currentIssue ? t(currentIssue.labelKey as any) : lastEvent;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0f172a",
      padding: "20px",
      display: "flex",
      flexDirection: "column"
    }}>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        paddingBottom: "16px",
        borderBottom: "1px solid #334155"
      }}>
        <div>
          <div style={{
            fontSize: "0.75rem",
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "2px"
          }}>
            {t("APP_TITLE")}
          </div>
          <div style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "white",
            letterSpacing: "1px"
          }}>
            {houseId}
          </div>
        </div>
        <LanguageSelector />
      </div>

      {/* MAIN STATUS CARD */}
      <div style={{
        backgroundColor: isProduction ? "#166534" : "#991b1b",
        borderRadius: "12px",
        padding: "48px 32px",
        marginBottom: "32px",
        textAlign: "center",
        border: `4px solid ${isProduction ? "#22c55e" : "#ef4444"}`
      }}>
        <div style={{
          fontSize: "0.9rem",
          color: isProduction ? "#bbf7d0" : "#fecaca",
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontWeight: 600,
          marginBottom: "12px"
        }}>
          {isProduction ? "● RUNNING" : "● STOPPED"}
        </div>
        <div style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          color: "white",
          lineHeight: 1.2,
          letterSpacing: "1px"
        }}>
          {isProduction ? t("STATUS_RUNNING") : issueLabel}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        {EVENT_TYPES.map((type) => {
          const isResume = type.id === "RESUME";
          if (isProduction && isResume) return null;
          if (!isProduction && !isResume) return null;

          // PRIMARY ACTION (Resume)
          if (isResume) {
            return (
              <button
                key={type.id}
                onClick={() => logEvent(type.id)}
                style={{
                  padding: "40px",
                  backgroundColor: "#22c55e",
                  color: "#052e16",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "2rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  boxShadow: "0 8px 20px rgba(34, 197, 94, 0.4)"
                }}
              >
                {t(type.labelKey as any)}
              </button>
            );
          }

          // SECONDARY ACTIONS (Issues)
          return (
            <button
              key={type.id}
              onClick={() => logEvent(type.id)}
              style={{
                padding: "24px",
                backgroundColor: "#1e293b",
                color: type.color,
                border: `2px solid ${type.color}`,
                borderRadius: "8px",
                fontSize: "1.25rem",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}
            >
              {t(type.labelKey as any)}
            </button>
          );
        })}
      </div>

      {/* MISTAKE CANCEL */}
      {!isProduction && (
        <div style={{
          marginTop: "24px",
          textAlign: "center"
        }}>
          <button
            onClick={() => setLastEvent(null)}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: "0.875rem",
              cursor: "pointer",
              textDecoration: "underline",
              padding: "12px"
            }}
          >
            {t("MISTAKE_CANCEL")}
          </button>
        </div>
      )}

      {/* UNLINK */}
      <div style={{
        marginTop: "24px",
        paddingTop: "20px",
        borderTop: "1px solid #334155",
        textAlign: "center"
      }}>
        <button
          onClick={() => { localStorage.removeItem("house_id"); setHouseId(null); }}
          style={{
            background: "none",
            border: "none",
            color: "#475569",
            fontSize: "0.875rem",
            cursor: "pointer",
            padding: "8px"
          }}
        >
          ← {t("UNLINK")}
        </button>
      </div>
    </div>
  );
}