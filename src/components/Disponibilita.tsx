import React, { useState } from "react";
import ProducerCard from "./ProducerCard";

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

type Producer = {
  id: string;
  name: string;
  category: string;
  province_code: string;
  address: string | null;
  city: string | null;
  google_maps_url: string | null;
  website_url: string | null;
  notes: string | null;
};

type Props = {
  producers: Producer[];
  followedProducerIds: string[];
  selectedProvinceCode: string;
  selectedProvinceName?: string;
  onToggleFollow: (producerId: string) => void;
  onOpenProducer: (producer: Producer) => void;
  onUpdateProducer: (p: Producer) => void;
  onBack: () => void;
  onOpenMiaArea: () => void;
  onAddProducer: () => void;
  onDeleteProducer?: (id: string) => void;
  showCompletePassaggioCta?: boolean;
  onCompletePassaggio?: () => void;
};

export default function Disponibilita({
  producers,
  followedProducerIds,
  selectedProvinceCode,
  selectedProvinceName,
  onToggleFollow,
  onOpenProducer,
  onBack,
  onOpenMiaArea,
  onAddProducer,
  onUpdateProducer,
  onDeleteProducer,
  showCompletePassaggioCta = false,
  onCompletePassaggio,
}: Props) {
  const [prodTab, setProdTab] = useState<"area" | "seguiti">("area");
  const [categoryFilter, setCategoryFilter] = useState<string>("tutte");

  return (
    <div style={styles.page}>
              <div style={styles.headerRow}>
  <button type="button" onClick={onBack} style={styles.secondaryButton}>
    ← Indietro
  </button>

  {showCompletePassaggioCta && followedProducerIds.length > 0 ? (
    <button
      type="button"
      onClick={onCompletePassaggio}
      style={styles.completePassaggioBtn}
    >
      Completa il passaggio
    </button>
  ) : (
    <div />
  )}
</div>

     <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  }}
>
  <h2 style={{ ...styles.h2, margin: 0 }}>Produttori del tuo territorio</h2>

  <button
    type="button"
    onClick={onAddProducer}
    style={styles.addProducerBtn}
  >
    + Aggiungi produttore
  </button>
</div>

          <p style={{ ...styles.muted, marginTop: 6 }}>
              Provincia attuale: <strong>{selectedProvinceName || selectedProvinceCode}</strong>
          </p>

          <div style={styles.tabsRow}>
              <button
                  type="button"
                  style={{
                      ...styles.tabBtn,
                      ...(prodTab === "area" ? styles.tabBtnActive : {}),
                  }}
                  onClick={() => setProdTab("area")}
              >
                  PRODUTTORI
              </button>

              <button
                  type="button"
                  style={{
                      ...styles.tabBtn,
                      ...(prodTab === "seguiti" ? styles.tabBtnActive : {}),
                  }}
                  onClick={() => setProdTab("seguiti")}
              >
                  SEGUITI
              </button>
          </div>

                   <p style={{ ...styles.muted, marginTop: 10 }}>
              Per pubblicare un passaggio di spesa devi seguire il produttore.
          </p>

          <div style={{ marginTop: 12 }}>
              <div style={{ ...styles.muted, marginBottom: 10 }}>
                  In alto trovi chi ha aggiornato di recente.
              </div>
              <div
                  style={{
                      ...styles.muted,
                      marginBottom: 6,
                      fontSize: 13,
                      fontStyle: "italic",
                  }}
              >
                  Per vedere solo una categoria, scegli nell’elenco.
              </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={styles.input}
        >
          <option value="tutte">Tutte le categorie</option>
          <option value="carni_salumi">🥩 Carni e salumi</option>
          <option value="trasformati">🥫 Conserve e trasformati</option>
          <option value="farine_pasta">🌾 Farine e pasta</option>
          <option value="formaggi">🧀 Formaggi e latticini</option>
          <option value="forno_pasticceria">🥖 Forno e pasticceria</option>
          <option value="legumi">🫘 Legumi</option>
          <option value="miele">🍯 Miele</option>
          <option value="olio">🫒 Olio</option>
          <option value="ortofrutta">🥦 Ortofrutta</option>
          <option value="pesce">🐟 Pesce e pescato</option>
          <option value="rivendita">🧺 Rivendita produttori locali</option>
          <option value="uova">🥚 Uova</option>
          <option value="vino">🍷 Vino</option>
        </select>
      </div>

      <div style={{ marginTop: 14, ...styles.sectionTitle }}>
        ELENCO COMPLETO
      </div>

      <div style={{ marginTop: 10, display: "grid", gap: 2 }}>
        {(() => {
          const filtered = (
            prodTab === "seguiti"
              ? producers.filter((p) => followedProducerIds.includes(p.id))
              : producers
          ).filter(
            (p) => categoryFilter === "tutte" || p.category === categoryFilter
          );

          if (filtered.length === 0) {
            return (
              <div style={{ ...styles.card, padding: 14 }}>
                <div style={{ ...styles.cardSub, fontSize: 14 }}>
                  Per ora non ci sono produttori in questa provincia. Se vuoi
                  puoi aggiungerne uno tu.
                </div>
              </div>
            );
          }

          return filtered.map((p) => (
            <ProducerCard
              key={p.id}
              id={p.id}
              name={p.name}
              category={p.category}
              meta={`${CATEGORY_META[p.category]?.label || p.category} • ${
                p.address || ""
              }${p.city ? " " + p.city : ""}`}
              desc={p.notes || ""}
              isFollowed={followedProducerIds.includes(p.id)}
              onToggleFollow={() => onToggleFollow(p.id)}
              onClick={() => onOpenProducer(p)}
              onUpdate={() => {
                const name = window.prompt("Nome produttore:", p.name);
                if (name === null) return;

                const category = window.prompt("Categoria:", p.category);
                if (category === null) return;

                const address = window.prompt("Indirizzo:", p.address || "");
                if (address === null) return;

                const city = window.prompt("Comune:", p.city || "");
                if (city === null) return;

                const notes = window.prompt("Note:", p.notes || "");
                if (notes === null) return;

                onUpdateProducer({
                  ...p,
                  name: name.trim(),
                  category: category.trim(),
                  address: address.trim(),
                  city: city.trim(),
                  notes: notes.trim(),
                });
              }}
              onDelete={() => onDeleteProducer?.(p.id)}
            />
          ));
        })()}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: "min(520px, 100%)",
    paddingBottom: 90,
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
 
  h2: {
    fontSize: 18,
    fontWeight: 800,
      margin: "6px 0 10px",
      color: "#D97706",
  },
  muted: {
    color: "#242827",
    fontSize: 14,
    margin: 0,
    lineHeight: 1.45,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #eee6d7",
    background: "#fff",
    fontFamily: "inherit",
  },
  tabsRow: { display: "flex", gap: 10, marginTop: 6 },
  tabBtn: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid #eee6d7",
    background: "transparent",
    cursor: "pointer",
    color: "#6f6b62",
    fontWeight: 600,
  },
  tabBtnActive: { background: "#fff", color: "#1f1f1f" },
  sectionTitle: {
    color: "#6f6b62",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 28,
    border: "1px solid #eee6d7",
    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
  },
  cardSub: { color: "#3f3a33", fontSize: 14, marginTop: 3 },
    primaryBtn: {
        alignSelf: "center",
        minWidth: 210,
        maxWidth: 300,
        padding: "12px 18px",
        borderRadius: 999,
        background: "#466b5a",
        color: "#fff",
        fontWeight: 700,
        fontSize: 15,
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(70,107,90,0.18)",
    },
        completePassaggioBtn: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "#F3C476",
    color: "#6B4300",
    fontWeight: 800,
    fontSize: 13,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(243,196,118,0.22)",
    whiteSpace: "nowrap",
  },
    addProducerBtn: {
    padding: "10px 14px",
    borderRadius: 999,
    background: "#466b5a",
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(70,107,90,0.18)",
    whiteSpace: "nowrap",
  },
    secondaryButton: {
        alignSelf: "center",
        minWidth: 0,
        maxWidth: "none",
        padding: "2px 4px",
        borderRadius: 0,
        background: "transparent",
        color: "#6f6b62",
        fontWeight: 500,
        fontSize: 12,
        border: "none",
        cursor: "pointer",
        opacity: 0.8,
    },
};