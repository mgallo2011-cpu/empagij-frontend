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
const [tripsSaved, setTripsSaved] = React.useState(0);
const [haAderito, setHaAderito] = React.useState(false);

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
  const richieste = JSON.parse(localStorage.getItem("empagij_requests") || "[]");

  if (Array.isArray(richieste) && richieste.length > 0) {
    setHaAderito(true);
  } else {
    setHaAderito(false);
  }
}, []);
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

      <h2 style={styles.h2}>Risparmia un viaggio: fate la spesa insieme</h2>

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
            <div style={styles.cardTitle}>Chi sta andando?</div>

            {passaggiAttivi > 0 && <div style={styles.redDot} />}
          </div>

          <div style={styles.cardSub}>
            Vedi i passaggi nella tua cerchia
          </div>
        </div>

        <div
          style={styles.card}
          onClick={() => setScreen({ name: "tabs", tab: "disponibilita" })}
        >
          <div style={styles.cardTitle}>Produttori vicini a te</div>
          <div style={styles.cardSub}>
            Scopri cosa puoi comprare
          </div>
        </div>
      </div>
          <div style={styles.impactCard}>
              <div style={styles.impactNumber}>
  {tripsSaved.toLocaleString()}
</div>
              <div style={styles.impactTitle}>Viaggi risparmiati insieme</div>
              <div style={styles.impactSub}>Basato sulle adesioni</div>
          </div>
          <div
              style={{
                  display: "grid",
                  gap: 20,
                  marginTop: 46,
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
          Vado io a fare la spesa
        </button>

              {!haAderito && (
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
    Chiedi se qualcuno sta andando
  </button>
)}
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
                  Come funziona in 30 secondi
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
    fontWeight: 800,
    margin: "6px 0 10px",
    color: "#D97706",
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
        marginTop: 12,
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