import React from "react";

export type BottomNavTab = "home" | "cerchia" | "disponibilita" | "impostazioni";

type BottomNavProps = {
  tab: BottomNavTab;
  setTab: (t: BottomNavTab) => void;
  onOpenFriends: () => void;
  pendingCerchiaCount: number;
};

const styles = {
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    background: "#f6f4ef",
    borderTop: "1px solid #eee6d7",
    padding: "10px 10px 14px",
    display: "flex",
    justifyContent: "center",
    gap: 10,
  } as React.CSSProperties,
  navItem: {
    width: 90,
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: 14,
    padding: "8px 10px",
    display: "grid",
    justifyItems: "center",
    gap: 4,
    color: "#6f6b62",
    cursor: "pointer",
  } as React.CSSProperties,
  navItemActive: {
    color: "#2f4a3d",
    background: "#fff",
    border: "1px solid #eee6d7",
  } as React.CSSProperties,
};

export default function BottomNav({
  tab,
  setTab,
  onOpenFriends,
  pendingCerchiaCount,
}: BottomNavProps) {
  const Item = ({
    id,
    label,
    icon,
    onClick,
  }: {
    id: BottomNavTab;
    label: string;
    icon: string;
    onClick?: () => void;
  }) => {
    const active = tab === id;

    return (
      <button
        onClick={onClick ?? (() => setTab(id))}
        style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
      >
        <div style={{ fontSize: 18, lineHeight: "18px" }}>{icon}</div>
        <div style={{ fontSize: 12 }}>{label}</div>
      </button>
    );
  };

  return (
    <div style={styles.nav}>
      <Item id="home" label="Home" icon="⌂" />
      <Item
        id="cerchia"
        label={
          pendingCerchiaCount > 0
            ? `Cerchia (${pendingCerchiaCount})`
            : "Cerchia"
        }
        icon="◯"
      />
      <Item id="disponibilita" label="Produttori" icon="📍" />
      <Item id="impostazioni" label="Impostazioni" icon="⚙︎" />
    </div>
  );
}