import { openDB } from "idb";

export const dbPromise = openDB("fusion-db", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("events")) {
      db.createObjectStore("events", { keyPath: "event_id" });
    }

    if (!db.objectStoreNames.contains("houses")) {
      db.createObjectStore("houses", { keyPath: "house_id" });
    }

    if (!db.objectStoreNames.contains("orders")) {
      db.createObjectStore("orders", { keyPath: "order_id" });
    }
  },
});
