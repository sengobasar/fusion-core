import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";

type House = {
  house_id: string;
  name?: string;
  ward?: string;
  cost_center?: string; // NEW: ERP Mapping ID
  active: boolean;
};

export default function SetupView() {
  const [houses, setHouses] = useState<House[]>([]);
  const [form, setForm] = useState<Partial<House>>({ active: true });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadHouses();
  }, []);

  async function loadHouses() {
    const db = await dbPromise;
    const allHouses = await db.getAll("houses");
    setHouses(allHouses);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.house_id) return;

    const db = await dbPromise;
    await db.put("houses", {
      house_id: form.house_id,
      name: form.name || "",
      ward: form.ward || "",
      cost_center: form.cost_center || "",
      active: form.active ?? true,
    });

    setForm({ active: true });
    setIsEditing(false);
    loadHouses();
  }

  async function toggleActive(house: House) {
    const db = await dbPromise;
    await db.put("houses", { ...house, active: !house.active });
    loadHouses();
  }

  function editHouse(house: House) {
    setForm(house);
    setIsEditing(true);
  }

  return (
    <div style={{ padding: "var(--space-lg)", maxWidth: "800px", margin: "0 auto" }}>
      <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-lg)" }}>
        <div>
          <h2 style={{ marginBottom: "var(--space-xs)" }}>Configuration</h2>
          <p className="text-sm">Manage houses and machines in the cluster.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-lg)" }}>
        <h3 className="text-lg" style={{ marginBottom: "var(--space-md)" }}>
          {isEditing ? "Edit House" : "Add New House"}
        </h3>
        <form onSubmit={handleSubmit} className="flex-col gap-md">
          <div className="flex-col gap-sm">
            <label className="text-sm" style={{ fontWeight: 500 }}>House ID (Required)</label>
            <input
              type="text"
              required
              placeholder="e.g. H-1"
              value={form.house_id || ""}
              onChange={(e) => setForm({ ...form, house_id: e.target.value })}
              disabled={isEditing} // ID is key, cannot change easily without delete-recreate logic
              style={{
                padding: "8px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "1rem"
              }}
            />
          </div>

          <div className="flex-row gap-md" style={{ alignItems: "flex-start" }}>
            <div className="flex-col gap-sm" style={{ flex: 1 }}>
              <label className="text-sm" style={{ fontWeight: 500 }}>Name / Description</label>
              <input
                type="text"
                placeholder="Optional"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  padding: "8px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "1rem"
                }}
              />
            </div>
            <div className="flex-col gap-sm" style={{ flex: 1 }}>
              <label className="text-sm" style={{ fontWeight: 500 }}>Ward / Cluster</label>
              <input
                type="text"
                placeholder="Optional"
                value={form.ward || ""}
                onChange={(e) => setForm({ ...form, ward: e.target.value })}
                style={{
                  padding: "8px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "1rem"
                }}
              />
            </div>
          </div>

          <div className="flex-col gap-sm">
            <label className="text-sm" style={{ fontWeight: 500 }}>Cost Center (ERP ID)</label>
            <input
              type="text"
              placeholder="e.g. CC-101 (Optional)"
              value={form.cost_center || ""}
              onChange={(e) => setForm({ ...form, cost_center: e.target.value })}
              style={{
                padding: "8px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "1rem"
              }}
            />
          </div>

          <div className="flex-row gap-sm">
            <input
              type="checkbox"
              id="activeCheck"
              checked={form.active ?? true}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              style={{ width: "16px", height: "16px" }}
            />
            <label htmlFor="activeCheck" className="text-sm">Active</label>
          </div>

          <div className="flex-row gap-md" style={{ marginTop: "var(--space-sm)" }}>
            <button
              type="submit"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600
              }}
            >
              {isEditing ? "Update House" : "Create House"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setForm({ active: true });
                  setIsEditing(false);
                }}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)"
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="text-lg" style={{ marginBottom: "var(--space-md)" }}>Existing Houses</h3>
        {houses.length === 0 ? (
          <p className="text-sm" style={{ fontStyle: "italic" }}>No houses configured yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "8px" }}>ID</th>
                <th style={{ padding: "8px" }}>Name</th>
                <th style={{ padding: "8px" }}>Ward</th>
                <th style={{ padding: "8px" }}>Cost Center</th>
                <th style={{ padding: "8px" }}>Status</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {houses.map((h) => (
                <tr key={h.house_id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "8px", fontWeight: 600 }}>{h.house_id}</td>
                  <td style={{ padding: "8px" }}>{h.name || "-"}</td>
                  <td style={{ padding: "8px" }}>{h.ward || "-"}</td>
                  <td style={{ padding: "8px" }}>{h.cost_center || "-"}</td>
                  <td style={{ padding: "8px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: h.active ? "#dcfce7" : "#f1f5f9",
                      color: h.active ? "#166534" : "#64748b",
                      fontSize: "0.75rem",
                      fontWeight: 600
                    }}>
                      {h.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    <button
                      onClick={() => editHouse(h)}
                      style={{
                        marginRight: "8px",
                        background: "none",
                        border: "none",
                        color: "var(--color-primary)",
                        textDecoration: "underline",
                        padding: 0
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(h)}
                      style={{
                        background: "none",
                        border: "none",
                        color: h.active ? "var(--color-text-secondary)" : "var(--color-success)",
                        textDecoration: "underline",
                        padding: 0
                      }}
                    >
                      {h.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
