import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";

const EVENT_TYPES = [
  { id: "THREAD_BREAK", label: "Thread Break", color: "#f59e0b" }, // Warning
  { id: "NO_MATERIAL", label: "No Material", color: "#ef4444" },  // Critical
  { id: "NO_ORDER", label: "No Order", color: "#f97316" },     // Warning
  { id: "RESUME", label: "Resume Work", color: "#22c55e" },      // Success
];

export default function WorkerView() {
  const [houseId, setHouseId] = useState<string | null>(localStorage.getItem("house_id"));
  const [activeHouses, setActiveHouses] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  // Load available houses if not selected
  useEffect(() => {
    if (!houseId) {
      dbPromise.then(async (db) => {
        const houses = await db.getAll("houses");
        setActiveHouses(houses.filter((h: any) => h.active).map((h: any) => h.house_id));
      });
    } else {
      // Load last state (mocking this by checking last event for today could be better, but simple for now)
      // ideally we would read the last event from DB for this house
      restoreState();
    }
  }, [houseId]);

  async function restoreState() {
    // Find the very last event for this house to set initial status
    // This is a simple improvement to show correct state on reload
    const db = await dbPromise;
    const allEvents = await db.getAll("events");
    // Filter for this house and sort by time desc
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
      order_id: "ORD-001", // Placeholder
      event_type: eventType,
      timestamp: new Date().toISOString(),
      source: "PWA",
    });

    setLastEvent(eventType);
  }

  // 1. SELECT HOUSE SCREEN
  if (!houseId) {
    return (
      <div style={{ padding: "var(--space-lg)", maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ marginBottom: "var(--space-md)" }}>Select Your Station</h2>
        <div className="flex-col gap-md">
          {activeHouses.length === 0 && <p>No active houses found. Please ask supervisor to configure.</p>}
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

  return (
    <div style={{ padding: "var(--space-md)", height: "100%", display: "flex", flexDirection: "column" }}>

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
          Connected to {houseId}
        </div>
        <div style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: isProduction ? "#166534" : "#991b1b"
        }}>
          {isProduction ? "Production Running" : `Issue: ${currentIssue?.label || lastEvent}`}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex-col gap-md" style={{ flex: 1 }}>
        {EVENT_TYPES.map((type) => {
          if (type.id === "RESUME" && isProduction) return null; // Don't show Resume if already running
          if (type.id !== "RESUME" && !isProduction) return null; // Don't show Break options if already halted (simplified flow)

          // Actually, usually you might want to switch break types, but for "Low cognitive load", 
          // maybe we only show RESUME when broken, and BREAKS when running.
          // Let's stick to the prompt: "Show only large, simple action buttons".
          // If I hide buttons it might be confusing if they picked the wrong one.
          // Let's show RESUME always if broken, and others always if running.

          const isResume = type.id === "RESUME";

          // LOGIC: 
          // If RUNNING: Show All Breaks.
          // If BROKEN: Show RESUME + maybe Switch Break? 
          // Prompt says: "Issue active: NO_MATERIAL" ... "Buttons must be large".
          // For simplicity/clarity:
          // - If Running: Show Breaks.
          // - If Broken: Show Resume. (And maybe "Change Reason" which is just showing the breaks again?)
          // Let's keep it extremely simple.

          if (isProduction && isResume) return null; // Hide Resume when running
          if (!isProduction && !isResume) return null; // Hide Breaks when broken (must resume first)

          // Actually, what if they hit "No Material" but meant "Thread Break"? 
          // They would have to Resume then break again. That is acceptable for V1 simplicity.

          return (
            <button
              key={type.id}
              onClick={() => logEvent(type.id)}
              style={{
                flex: 1,
                maxHeight: "120px",
                backgroundColor: type.id === "RESUME" ? "var(--color-bg-card)" : type.color, // Color for breaks, White for resume? Or inverse?
                // Let's make breaks colorful and Resume Green.
                // Wait, prompt says: "High-contrast".

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
              {type.label}
            </button>
          );
        })}

        {/* If broken, maybe show a small "Correction" button? */}
        {!isProduction && (
          <div style={{ marginTop: "auto", textAlign: "center" }}>
            <p className="text-sm">Mistake? <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => setLastEvent(null)}>Cancel Status</span></p>
          </div>
        )}
      </div>

      <div style={{ marginTop: "var(--space-lg)", textAlign: "center" }}>
        <button
          onClick={() => { localStorage.removeItem("house_id"); setHouseId(null); }}
          style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "0.875rem" }}
        >
          Unlink Device
        </button>
      </div>
    </div>
  );
}
