import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

type MainLayoutProps = {
    children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
    const location = useLocation();

    const navItems = [
        { label: "Worker", path: "/worker" },
        { label: "Supervisor", path: "/supervisor" },
        { label: "Alerts", path: "/alerts" },
        { label: "Advisory", path: "/advisory" }, // ✅ Layer 4
        { label: "Impact", path: "/impact" },     // ✅ Layer 5
        { label: "Setup", path: "/setup" },
    ];

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                width: "100vw",
                overflow: "hidden",
            }}
        >
            {/* Sidebar */}
            <aside
                style={{
                    width: "240px",
                    backgroundColor: "var(--color-bg-sidebar)",
                    color: "var(--color-text-inverse)",
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        padding: "var(--space-md) var(--space-lg)",
                        borderBottom: "1px solid #334155",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "1.25rem",
                            margin: 0,
                            color: "white",
                            fontWeight: 700,
                        }}
                    >
                        FloorSight
                    </h1>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        MES Platform
                    </span>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: "var(--space-md)" }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: "block",
                                    padding: "var(--space-md)",
                                    marginBottom: "var(--space-xs)",
                                    borderRadius: "var(--radius-sm)",
                                    textDecoration: "none",
                                    color: isActive ? "#fff" : "#94a3b8",
                                    backgroundColor: isActive
                                        ? "rgba(255,255,255,0.1)"
                                        : "transparent",
                                    fontWeight: isActive ? 600 : 400,
                                }}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div
                    style={{
                        padding: "var(--space-md)",
                        fontSize: "0.75rem",
                        color: "#64748b",
                    }}
                >
                    v1.0.0
                </div>
            </aside>

            {/* Main Content */}
            <main
                style={{
                    flex: 1,
                    overflowY: "auto",
                    backgroundColor: "var(--color-bg-app)",
                    position: "relative",
                }}
            >
                {children}
            </main>
        </div>
    );
}
