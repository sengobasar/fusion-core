import { dbPromise } from "../db/db";

const EVENT_TYPES = [
  "THREAD_BREAK",
  "NO_MATERIAL",
  "NO_ORDER",
  "RESUME",
];

export default function WorkerView() {
  // 🔐 Read bound house ID (set once via /setup)
  const houseId = localStorage.getItem("house_id");

  // 🚫 Block usage if phone not configured
  if (!houseId) {
    return (
      <div style={{ padding: "16px" }}>
        <h2>Phone Not Configured</h2>
        <p>This phone is not linked to a house yet.</p>
        <a href="/setup">Go to Setup</a>
      </div>
    );
  }

  async function logEvent(eventType: string) {
    const db = await dbPromise;

    await db.put("events", {
      event_id: crypto.randomUUID(),
      house_id: houseId, // ✅ AUTO-TAGGED
      order_id: "ORD-001",
      event_type: eventType,
      timestamp: new Date().toISOString(),
      source: "PWA",
    });

    console.log("Event logged:", eventType, "for house", houseId);
  }

  return (
    <div style={{ padding: "16px" }}>
      <h2>Worker Panel</h2>

      {EVENT_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => logEvent(type)}
          style={{
            display: "block",
            width: "100%",
            padding: "16px",
            marginBottom: "12px",
            fontSize: "16px",
          }}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
