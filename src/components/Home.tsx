import React from "react";

type Props = {
  setScreen: any;
  producers: any[];
  passaggi: any[];
  cerchie: any[];
};

export default function Home({
  setScreen,
  producers,
  passaggi,
  cerchie,
}: Props) {
const passaggiConCerchia = passaggi.map((p) => {
  const cerchia = cerchie.find((c) => c.id === p.circleId);
  return {
    ...p,
    circleName: cerchia?.name || "Cerchia",
  };
});

    const passaggiAttivi = passaggiConCerchia.length;
    const titoloDinamico =
        passaggiAttivi > 0
            ? "La tua cerchia si sta muovendo..."
            : "Nessuno sta andando... per ora";
    const [tripsSaved, setTripsSaved] = React.useState(0);

React.useEffect(() => {
  fetch("https://empagij-backend-delsud.onrender.com/metrics/trips-saved")
    .then((res) => res.json())
    .then((data) => {
      if (data?.ok) {
        setTripsSaved(data.tripsSaved || 0);
      }
    })
    .catch((err) => {
      console.error("Trips saved fetch error:", err);
    });
}, []);
    React.useEffect(() => {
    }, []);
    if (typeof document !== "undefined") {
        const style = document.createElement("style");
        style.innerHTML = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
        }
    `;
        document.head.appendChild(style);
    }
  return (
    <div style={styles.page}>
          <div style={styles.topbar}>
              <div />
              <div
                  style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                  }}
              >
                  <img
                      src="/logo192-B.png"
                      alt="Logo SpesaConTe"
                      style={{ width: 36, height: 36, objectFit: "contain" }}
                  />
                  <div style={styles.brand}>SpesaConTe</div>
              </div>
              <div style={styles.avatar}>🙂</div>
          </div>

      <h2 style={styles.h2}>{titoloDinamico}</h2>

          <div style={styles.cardsCol}>
              <div
                  style={{
                      ...styles.card,
                      border: passaggiAttivi > 0 ? "2px solid #F4B942" : styles.card.border,
                      boxShadow:
                          passaggiAttivi > 0
                              ? "0 6px 18px rgba(244,185,66,0.18)"
                              : styles.card.boxShadow,
                  }}
                  onClick={() => setScreen({ name: "cerchiaPassaggi" })}
              >
                  {passaggiAttivi > 0 ? (
                      <>
                          <div
                              style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                              }}
                          >
                              <div
                                  style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      minWidth: 0,
                                  }}
                              >
                                  <div style={{ fontSize: 22 }}>🧺</div>
                                  <div style={styles.cardTitle}>Chi sta andando?</div>
                              </div>

                              <div
                                  style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      minWidth: 30,
                                      height: 30,
                                      padding: "0 10px",
                                      borderRadius: 999,
                                      background: "#FFF4F2",
                                      border: "1px solid #F1C7BF",
                                      color: "#C84A3A",
                                      fontWeight: 800,
                                      fontSize: 15,
                                      flex: "0 0 auto",
                                      animation: passaggiAttivi > 0 ? "pulse 1.6s ease-in-out infinite" : "none",
                                  }}
                              >
                                  {passaggiAttivi}
                              </div>
                          </div>

                          <div style={{ ...styles.cardSub, marginTop: 6 }}>
                              Vedi i passaggi attivi nelle tue cerchie
                          </div>
                      </>
                  ) : (
                      <>
                              <button
                                  type="button"
                                  style={{
                                      ...styles.primaryBtn,
                                      marginTop: 0,
                                      minWidth: 200,
                                      background: "#F4B942",
                                      color: "#4E3200",
                                      boxShadow: "0 6px 16px rgba(244,185,66,0.28)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 8,
                                  }}
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      setScreen({ name: "producersFollowed", mode: "stoAndando" });
                                  }}
                              >
                                  <span>🚗</span>
                                  <span>Fai partire tu il primo passaggio</span>
                              </button>

                              <div
                                  style={{
                                      ...styles.cardSub,
                                      marginTop: 12,
                                      textAlign: "center",
                                  }}
                              >
                                  Avvisa la tua cerchia e raccogli le richieste
                              </div>
                      </>
                  )}
              </div>

              <div
                  style={styles.card}
                  onClick={() => setScreen({ name: "tabs", tab: "disponibilita" })}
              >
                  <div
                      style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                      }}
                  >
                      <div style={{ fontSize: 22, display: "flex", gap: 6 }}>
                          <span>🍎</span>
                          <span>🍷</span>
                      </div>

                      <div style={styles.cardTitle}>Produttori vicini a te</div>
                  </div>

                  <div style={styles.cardSub}>Scopri cosa puoi comprare</div>
              </div>
          </div>
          <div style={styles.impactCard}>
              <div
                  style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      marginBottom: 6,
                  }}
              >
                  <div style={{ fontSize: 22, lineHeight: 1 }}>🚗</div>
                  <div style={styles.impactNumber}>
                      {tripsSaved.toLocaleString()}
                  </div>
              </div>
              <div style={styles.impactTitle}>Viaggi risparmiati</div>
              <div style={styles.impactSub}>Grazie anche alla tua cerchia</div>
          </div>
         <div style={{ flex: 1 }} />
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
  topbar: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
  },
   brand: {
    fontWeight: 900,
    letterSpacing: 0.3,
    color: "#14b414",
    fontSize: 20,
  },
  avatar: {
    justifySelf: "end",
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "#efe9df",
    border: "1px solid #e1d8c9",
    fontSize: 14,
  },
    h2: {
        fontSize: 18,
        fontWeight: 600,
        margin: "6px 0 10px",
        color: "#2d8881",
        textAlign: "center",
    },
  cardsCol: {
    display: "grid",
    gap: 12,
    marginTop: 8,
  },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 28,
    border: "1px solid #eee6d7",
    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
    cursor: "pointer",
  },
  cardTitle: {
    fontWeight: 800,
    color: "#1a1a1a",
    fontSize: 16,
  },
  cardSub: {
    color: "#3f3a33",
    fontSize: 14,
    marginTop: 3,
    },
    redDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        background: "#c84a3a",
        flex: "0 0 auto",
    },
    impactCard: {
        background: "#eaf7ff",
        borderRadius: 16,
        padding: "12px 16px",
        border: "1px solid #bfe3f7",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
        marginTop: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
    },
    impactNumber: {
        fontSize: 18,
        lineHeight: 1,
        fontWeight: 900,
        color: "#1f7a8c",
        marginBottom: 4,
    },
    impactTitle: {
        fontWeight: 800,
        color: "#1a1a1a",
        fontSize: 14,
        marginBottom: 2,
    },
    impactSub: {
        color: "#4e6772",
        fontSize: 12,
    },
    primaryBtn: {
        alignSelf: "center",
        marginLeft: "auto",
        marginRight: "auto",
        minWidth: 260,
        maxWidth: 360,
        padding: "15px 20px",
        borderRadius: 999,
        background: "#2f4a3d",
        color: "#fff",
        fontWeight: 800,
        fontSize: 16,
        border: "none",
        cursor: "pointer",
        boxShadow: "0 6px 18px rgba(47,74,61,0.28)",
    },
    secondaryBtn: {
        alignSelf: "center",
        minWidth: 220,
        maxWidth: 320,
        padding: "12px 14px",
        borderRadius: 999,
        background: "#d7e7f2",
        color: "#1f2a33",
        fontWeight: 700,
        border: "1px solid #b7c9d7",
        cursor: "pointer",
    },
  muted: {
    color: "#242827",
    fontSize: 14,
    margin: 0,
    lineHeight: 1.45,
  },
    linkBtn: {
        display: "inline-block",
        background: "#f4b183",
        border: "1px solid #e39a67",
        color: "#5a2f12",
        cursor: "pointer",
        fontWeight: 700,
        padding: "8px 14px",
        borderRadius: 999,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    },
};