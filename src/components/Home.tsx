import React from "react";

type Props = {
  setScreen: any;
  producers: any[];
  passaggi: any[];
};

export default function Home({
  setScreen,
  producers,
  passaggi,
}: Props) {
  const passaggiAttivi = passaggi.length;

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div />
        <div style={styles.brand}>empagij</div>
        <div style={styles.avatar}>🙂</div>
      </div>

      <h2 style={styles.h2}>Cosa succede intorno a te?</h2>

      <div style={styles.cardsCol}>
               <div
          style={styles.card}
          onClick={() => setScreen({ name: "cerchiaPassaggi" })}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={styles.cardTitle}>nella tua cerchia</div>

            {passaggiAttivi > 0 && (
              <div style={styles.redDot} />
            )}
          </div>

          <div style={styles.cardSub}>
            {passaggiAttivi === 0
              ? "nessun passaggio attivo"
              : passaggiAttivi === 1
              ? "1 passaggio attivo"
              : `${passaggiAttivi} passaggi attivi`}
          </div>
        </div>

        <div
          style={styles.card}
          onClick={() => setScreen({ name: "tabs", tab: "disponibilita" })}
        >
          <div style={styles.cardTitle}>dai produttori</div>
          <div style={styles.cardSub}>Novità dai produttori</div>
         </div>
      </div>

          <div
              style={{
                  display: "grid",
                  gap: 16,
                  marginTop: 18,
                  justifyItems: "center",
              }}
          >
        <button
          type="button"
          style={{ ...styles.primaryBtn, minWidth: 240, maxWidth: 320 }}
          onClick={() =>
            setScreen({ name: "producersFollowed", mode: "stoAndando" })
          }
        >
          Sto andando
        </button>

              <button
                  type="button"
                  style={{
                      ...styles.secondaryBtn,
                      minWidth: 240,
                      maxWidth: 320,
                      border: "1px solid #b7c9d7",
                  }}
                  onClick={() =>
                      setScreen({ name: "piccolaRichiesta", fromTab: "home" })
                  }
              >
                  Richiesta
              </button>
      </div>

          <div
              style={{
                  paddingTop: 34,
                  paddingBottom: 10,
                  textAlign: "center",
              }}
          >
              <div style={{ ...styles.muted, marginBottom: 6 }}>
                  Ripasso veloce?
              </div>
              <button
                  type="button"
                  style={styles.linkBtn}
                  onClick={() => setScreen({ name: "intro" })}
              >
                  Come funziona empagij
              </button>
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
    fontWeight: 700,
    letterSpacing: 0.2,
    color: "#2f4a3d",
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
    fontWeight: 800,
    margin: "6px 0 10px",
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
  primaryBtn: {
    alignSelf: "center",
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