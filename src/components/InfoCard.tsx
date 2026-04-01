import React from "react";

type InfoCardProps = {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  onClick?: () => void;
};

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 28,
    border: "1px solid #eee6d7",
    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
  } as React.CSSProperties,
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  } as React.CSSProperties,
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "#f5f1ea",
    border: "1px solid #efe3d2",
    fontSize: 16,
    flex: "0 0 auto",
  } as React.CSSProperties,
  cardTitle: {
    fontWeight: 800,
    color: "#1a1a1a",
    fontSize: 16,
  } as React.CSSProperties,
  cardSub: {
    color: "#3f3a33",
    fontSize: 14,
    marginTop: 3,
  } as React.CSSProperties,
  dotBadge: {
    color: "#c84a3a",
    fontSize: 18,
    lineHeight: "18px",
    marginTop: 4,
  } as React.CSSProperties,
};

export default function InfoCard({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: InfoCardProps) {
  const clickable = typeof onClick === "function";

  return (
    <div
      style={{
        ...styles.card,
        cursor: clickable ? "pointer" : "default",
      }}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div style={styles.cardTop}>
        <div style={styles.iconCircle}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={styles.cardTitle}>{title}</div>
          <div style={styles.cardSub}>{subtitle}</div>
        </div>
        {badge ? <div style={styles.dotBadge}>{badge}</div> : null}
      </div>
    </div>
  );
}