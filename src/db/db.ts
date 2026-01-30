import { openDB } from "idb";

export const dbPromise = openDB("fusion-db", 2, {
  upgrade(db) {
    /* ---------- EVENTS ---------- */
    if (!db.objectStoreNames.contains("events")) {
      db.createObjectStore("events", { keyPath: "event_id" });
    }

    /* ---------- HOUSES ---------- */
    if (!db.objectStoreNames.contains("houses")) {
      db.createObjectStore("houses", { keyPath: "house_id" });
    }

    /* ---------- ORDERS ---------- */
    if (!db.objectStoreNames.contains("orders")) {
      db.createObjectStore("orders", { keyPath: "order_id" });
    }

    /* ---------- ALERTS (Layer 3) ---------- */
    if (!db.objectStoreNames.contains("alerts")) {
      const store = db.createObjectStore("alerts", {
        keyPath: "alert_id",
      });

      // Optional but useful indexes
      store.createIndex("by_status", "status");
      store.createIndex("by_house", "house_id");
      store.createIndex("by_severity", "severity");
    }
  },
});
