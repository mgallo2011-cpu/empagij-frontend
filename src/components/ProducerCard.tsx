import React from "react";

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  carni_salumi: { label: "Carni e salumi", icon: "🥩" },
  trasformati: { label: "Conserve e trasformati", icon: "🥫" },
  farine_pasta: { label: "Farine e pasta", icon: "🌾" },
  formaggi: { label: "Formaggi e latticini", icon: "🧀" },
  forno_pasticceria: { label: "Forno e pasticceria", icon: "🥖" },
  legumi: { label: "Legumi", icon: "🫘" },
  miele: { label: "Miele", icon: "🍯" },
  olio: { label: "Olio", icon: "🫒" },
  ortofrutta: { label: "Ortofrutta", icon: "🥦" },
  pesce: { label: "Pesce e pescato", icon: "🐟" },
  rivendita: { label: "Rivendita produttori locali", icon: "🧺" },
  uova: { label: "Uova", icon: "🥚" },
  vino: { label: "Vino", icon: "🍷" },
};

type ProducerCardProps = {
  id: string;
  name: string;
  category: string;
  meta: string;
  desc: string;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onClick: () => void;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
};

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 28,
    border: "1px solid #eee6d7",
    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
  } as React.CSSProperties,
  producerBtn: {
    width: "100%",
    border: "1px solid #eee6d7",
    background: "#fff",
    borderRadius: 16,
    padding: 14,
    cursor: "pointer",
    textAlign: "left",
  } as React.CSSProperties,
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  } as React.CSSProperties,
  iconSquare: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "#479485",
    color: "#fff",
    border: "1px solid #efe3d2",
    fontSize: 22,
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
  chev: {
    color: "#6f6b62",
    fontSize: 20,
    marginTop: 4,
  } as React.CSSProperties,
};

export default function ProducerCard({
  id,
  name,
  category,
  meta,
  desc,
  isFollowed,
  onToggleFollow,
  onClick,
  onUpdate,
  onDelete,
}: ProducerCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.producerBtn} onClick={onClick} role="button" tabIndex={0}>
        <div style={styles.cardTop}>
          <div style={styles.iconSquare}>
            {CATEGORY_META[category]?.icon || "📍"}
          </div>

          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={styles.cardTitle}>{name}</div>
            <div style={styles.cardSub}>{meta}</div>
            <div style={{ ...styles.cardSub, marginTop: 6 }}>{desc}</div>
          </div>

          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFollow();
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: isFollowed
                  ? "1px solid #2e7d32"
                  : "1px solid rgba(0,0,0,0.15)",
                background: isFollowed ? "#2e7d32" : "white",
                color: isFollowed ? "white" : "inherit",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isFollowed ? "✓ Seguito" : "Segui"}
            </button>
          </div>

          <div style={styles.chev}>›</div>
        </div>
      </div>
    </div>
  );
}