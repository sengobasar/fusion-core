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
        { label: "Advisory", path: "/advisory" },
        { label: "Impact", path: "/impact" },
        { label: "Predictive", path: "/predictive" },
        { label: "Setup", path: "/setup" },
    ];

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                width: "100vw",
                overflow: "hidden",
                backgroundColor: "#1e293b",
            }}
        >
            {/* Sidebar */}
            <aside
                style={{
                    width: "260px",
                    backgroundColor: "#0f172a",
                    color: "var(--color-text-inverse)",
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                    borderRight: "1px solid #334155",
                    boxShadow: "2px 0 12px rgba(0, 0, 0, 0.3)",
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        padding: "24px 20px",
                        borderBottom: "1px solid #1e293b",
                        backgroundColor: "#020617",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "1.5rem",
                            margin: 0,
                            color: "white",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                        }}
                    >
                        FloorSight
                    </h1>
                    <span style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        fontWeight: 500
                    }}>
                        MES Platform
                    </span>
                </div>

                {/* Navigation */}
                <nav style={{
                    flex: 1,
                    padding: "16px 12px",
                    overflowY: "auto"
                }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "14px 16px",
                                    marginBottom: "6px",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    color: isActive ? "#ffffff" : "#94a3b8",
                                    backgroundColor: isActive
                                        ? "#1e40af"
                                        : "transparent",
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: "0.95rem",
                                    transition: "all 0.15s ease",
                                    border: isActive ? "1px solid #3b82f6" : "1px solid transparent",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "#1e293b";
                                        e.currentTarget.style.color = "#e2e8f0";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.color = "#94a3b8";
                                    }
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
                        padding: "16px 20px",
                        fontSize: "0.7rem",
                        color: "#475569",
                        borderTop: "1px solid #1e293b",
                        textAlign: "center",
                        backgroundColor: "#020617",
                    }}
                >
                    Version 1.0.0
                </div>
            </aside>

            {/* Main Content */}
            <main
                style={{
                    flex: 1,
                    overflowY: "auto",
                    backgroundColor: "#1e293b",
                    position: "relative",
                }}
            >
                {children}
            </main>
        </div>
    );
}