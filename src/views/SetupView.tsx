import { useEffect, useState } from "react";
import { dbPromise } from "../db/db";

type House = {
  house_id: string;
  name?: string;
  ward?: string;
  cost_center?: string;
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

  async function factoryReset() {
    if (!confirm("⚠️ FACTORY RESET: This will wipe ALL events, houses, and config. Are you sure?")) return;
    const db = await dbPromise;
    await db.clear("events");
    await db.clear("houses");
    await db.clear("alerts");
    if (db.objectStoreNames.contains("orders")) await db.clear("orders");
    localStorage.clear();
    location.reload();
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#1e293b",
      padding: "32px"
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "white",
            margin: 0,
            marginBottom: "8px",
            letterSpacing: "0.5px"
          }}>
            System Configuration
          </h1>
          <p style={{
            color: "#94a3b8",
            margin: 0,
            fontSize: "0.95rem"
          }}>
            Manage machines, workstations, and system settings
          </p>
        </div>

        {/* STATS ROW */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "40px"
        }}>
          <div style={{
            backgroundColor: "#0f172a",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #334155"
          }}>
            <div style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
              marginBottom: "8px"
            }}>
              Total Houses
            </div>
            <div style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "white"
            }}>
              {houses.length}
            </div>
          </div>

          <div style={{
            backgroundColor: "#0f172a",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #334155"
          }}>
            <div style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
              marginBottom: "8px"
            }}>
              Active
            </div>
            <div style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "#22c55e"
            }}>
              {houses.filter(h => h.active).length}
            </div>
          </div>

          <div style={{
            backgroundColor: "#0f172a",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #334155"
          }}>
            <div style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
              marginBottom: "8px"
            }}>
              Inactive
            </div>
            <div style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "#64748b"
            }}>
              {houses.filter(h => !h.active).length}
            </div>
          </div>
        </div>

        {/* ADD/EDIT FORM */}
        <div style={{
          backgroundColor: "#0f172a",
          padding: "32px",
          borderRadius: "12px",
          border: "1px solid #334155",
          marginBottom: "40px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "white",
            margin: 0,
            marginBottom: "24px",
            letterSpacing: "0.5px"
          }}>
            {isEditing ? "Edit House" : "Add New House"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "20px",
              marginBottom: "24px"
            }}>
              {/* House ID */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  House ID <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. h-1"
                  value={form.house_id || ""}
                  onChange={(e) => setForm({ ...form, house_id: e.target.value })}
                  disabled={isEditing}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    color: "white",
                    outline: "none"
                  }}
                />
              </div>

              {/* Name and Ward */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px"
              }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.85rem",
                    color: "#cbd5e1",
                    fontWeight: 600,
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Name / Description
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      color: "white",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.85rem",
                    color: "#cbd5e1",
                    fontWeight: 600,
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Ward / Cluster
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.ward || ""}
                    onChange={(e) => setForm({ ...form, ward: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      color: "white",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Cost Center */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Cost Center (ERP ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CC-101 (Optional)"
                  value={form.cost_center || ""}
                  onChange={(e) => setForm({ ...form, cost_center: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    color: "white",
                    outline: "none"
                  }}
                />
              </div>

              {/* Active Checkbox */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={form.active ?? true}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  style={{
                    width: "20px",
                    height: "20px",
                    cursor: "pointer"
                  }}
                />
                <label
                  htmlFor="activeCheck"
                  style={{
                    fontSize: "0.95rem",
                    color: "#cbd5e1",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  Active
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              paddingTop: "20px",
              borderTop: "1px solid #334155"
            }}>
              <button
                type="submit"
                style={{
                  padding: "12px 28px",
                  backgroundColor: "#1e40af",
                  color: "white",
                  border: "1px solid #3b82f6",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
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
                    padding: "12px 28px",
                    backgroundColor: "transparent",
                    color: "#94a3b8",
                    border: "1px solid #475569",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* EXISTING HOUSES TABLE */}
        <div style={{
          backgroundColor: "#0f172a",
          borderRadius: "12px",
          border: "1px solid #334155",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          marginBottom: "40px"
        }}>
          <div style={{
            padding: "24px 32px",
            borderBottom: "1px solid #334155"
          }}>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "white",
              margin: 0,
              letterSpacing: "0.5px"
            }}>
              Existing Houses
            </h2>
          </div>

          {houses.length === 0 ? (
            <div style={{
              padding: "60px 32px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "1rem"
            }}>
              No houses configured yet. Add your first house above.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem"
              }}>
                <thead style={{
                  backgroundColor: "#020617"
                }}>
                  <tr>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#94a3b8",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      borderBottom: "1px solid #334155"
                    }}>
                      ID
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#94a3b8",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      borderBottom: "1px solid #334155"
                    }}>
                      Name
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#94a3b8",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      borderBottom: "1px solid #334155"
                    }}>
                      Ward
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#94a3b8",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      borderBottom: "1px solid #334155"
                    }}>
                      Cost Center
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#94a3b8",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      borderBottom: "1px solid #334155"
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: "16px 20px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "#94a3b8",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      borderBottom: "1px solid #334155"
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {houses.map((h, idx) => (
                    <tr
                      key={h.house_id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#0f172a" : "#1e293b",
                        borderBottom: "1px solid #334155"
                      }}
                    >
                      <td style={{
                        padding: "16px 20px",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.95rem"
                      }}>
                        {h.house_id}
                      </td>
                      <td style={{
                        padding: "16px 20px",
                        color: "#cbd5e1"
                      }}>
                        {h.name || "-"}
                      </td>
                      <td style={{
                        padding: "16px 20px",
                        color: "#cbd5e1"
                      }}>
                        {h.ward || "-"}
                      </td>
                      <td style={{
                        padding: "16px 20px",
                        color: "#cbd5e1"
                      }}>
                        {h.cost_center || "-"}
                      </td>
                      <td style={{
                        padding: "16px 20px"
                      }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "4px",
                          background: h.active ? "#166534" : "#1e293b",
                          color: h.active ? "#bbf7d0" : "#64748b",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          border: h.active ? "1px solid #22c55e" : "1px solid #475569"
                        }}>
                          {h.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{
                        padding: "16px 20px",
                        textAlign: "right"
                      }}>
                        <button
                          onClick={() => editHouse(h)}
                          style={{
                            marginRight: "16px",
                            background: "none",
                            border: "none",
                            color: "#3b82f6",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(h)}
                          style={{
                            background: "none",
                            border: "none",
                            color: h.active ? "#94a3b8" : "#22c55e",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline"
                          }}
                        >
                          {h.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DANGER ZONE */}
        <div style={{
          backgroundColor: "#0f172a",
          padding: "32px",
          borderRadius: "12px",
          border: "2px solid #ef4444",
          boxShadow: "0 2px 12px rgba(239, 68, 68, 0.3)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h3 style={{
                color: "#ef4444",
                fontSize: "1.1rem",
                margin: 0,
                marginBottom: "8px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                ⚠ Danger Zone
              </h3>
              <p style={{
                color: "#fecaca",
                fontSize: "0.9rem",
                margin: 0
              }}>
                This action will permanently delete all data and cannot be undone
              </p>
            </div>
            <button
              onClick={factoryReset}
              style={{
                padding: "12px 24px",
                backgroundColor: "#7f1d1d",
                color: "#fecaca",
                border: "1px solid #ef4444",
                borderRadius: "6px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Factory Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}