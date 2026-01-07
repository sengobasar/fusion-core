import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";
import { useNavigate } from "react-router-dom";

type House = {
  house_id: string;
  cluster_id: string;
  active: boolean;
};

export default function SetupView() {
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHouses() {
      const db = await dbPromise;
      const all = await db.getAll("houses");
      setHouses(all.filter((h) => h.active));
    }
    loadHouses();
  }, []);

  function confirmBinding() {
    if (!selectedHouse) return;

    // 🔐 THIS IS THE BINDING
    localStorage.setItem("house_id", selectedHouse);

    // Go to worker screen
    navigate("/worker");
  }

  return (
    <div style={{ padding: "16px" }}>
      <h2>One-Time Phone Setup</h2>
      <p>Select the house this phone belongs to.</p>

      <select
        value={selectedHouse}
        onChange={(e) => setSelectedHouse(e.target.value)}
      >
        <option value="">Select house</option>
        {houses.map((h) => (
          <option key={h.house_id} value={h.house_id}>
            {h.house_id} ({h.cluster_id})
          </option>
        ))}
      </select>

      <button onClick={confirmBinding} style={{ marginLeft: "8px" }}>
        Confirm
      </button>
    </div>
  );
}
