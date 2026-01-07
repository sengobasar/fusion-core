import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";

type House = {
  house_id: string;
  cluster_id: string;
  active: boolean;
};

export default function HousesView() {
  const [houses, setHouses] = useState<House[]>([]);
  const [houseId, setHouseId] = useState("");
  const [clusterId, setClusterId] = useState("");

  async function loadHouses() {
    const db = await dbPromise;
    const all = await db.getAll("houses");
    setHouses(all);
  }

  async function addHouse() {
    if (!houseId || !clusterId) return;

    const db = await dbPromise;

    await db.put("houses", {
      house_id: houseId,
      cluster_id: clusterId,
      active: true,
    });

    setHouseId("");
    setClusterId("");
    loadHouses();
  }

  useEffect(() => {
    loadHouses();
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <h2>House Configuration</h2>

      <div style={{ marginBottom: "16px" }}>
        <input
          placeholder="House ID (e.g. H-12)"
          value={houseId}
          onChange={(e) => setHouseId(e.target.value)}
        />
        <input
          placeholder="Cluster (e.g. Ward-3)"
          value={clusterId}
          onChange={(e) => setClusterId(e.target.value)}
          style={{ marginLeft: "8px" }}
        />
        <button onClick={addHouse} style={{ marginLeft: "8px" }}>
          Add House
        </button>
      </div>

      <h3>Existing Houses</h3>

      {houses.length === 0 && <p>No houses configured yet.</p>}

      {houses.map((h) => (
        <div key={h.house_id}>
          <strong>{h.house_id}</strong> → {h.cluster_id} →{" "}
          {h.active ? "ACTIVE" : "INACTIVE"}
        </div>
      ))}
    </div>
  );
}
