import React from "react";
import { PROVINCES } from "../data/provinces";

type Props = {
  myName: string;
  selectedProvinceCode: string;
  onChangeProvince: (provinceCode: string) => void;
  onLogout: () => void;
};

export default function Impostazioni({
  myName,
  selectedProvinceCode,
  onChangeProvince,
  onLogout,
}: Props) {
  return (
    <div style={styles.page}>
      <h2 style={styles.h2}>Impostazioni</h2>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Utente</div>
        <div style={{ ...styles.card, padding: 12 }}>
          <div style={{ fontWeight: 700 }}>{myName || "—"}</div>
          <div style={{ opacity: 0.7, marginTop: 6, fontSize: 13 }}>
            (il nome viene dal login)
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Provincia attiva
          </div>
                             <select
            value={selectedProvinceCode}
            onChange={(e) => onChangeProvince(e.target.value)}
            style={{ ...styles.input, width: "100%" }}
          >
            {PROVINCES.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
          <div style={{ ...styles.muted, marginTop: 6 }}>
            Cambiando provincia esplori produttori di un altro territorio.
          </div>
        </div>

        <button
          type="button"
          style={{ ...styles.primaryButton, marginTop: 12 }}
          onClick={onLogout}
        >
          Esci (logout)
        </button>
      </div>

      <p style={styles.muted}>
        Qui mettiamo poi: profilo, cerchie, privacy, ecc.
      </p>
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
  h2: {
    fontSize: 18,
    fontWeight: 800,
    margin: "6px 0 10px",
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
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 28,
    border: "1px solid #eee6d7",
    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
  },
  primaryButton: {
    alignSelf: "center",
    minWidth: 220,
    maxWidth: 320,
    padding: "12px 14px",
    borderRadius: 999,
    background: "#2f4a3d",
    color: "#fff",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
};