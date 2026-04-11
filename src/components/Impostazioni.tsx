import React from "react";
import { PROVINCES } from "../data/provinces";

type Props = {
    myName: string;
    selectedProvinceCode: string;
    onChangeProvince: (provinceCode: string) => void;
    onLogout: () => void;
    onOpenIntro: () => void;
};

export default function Impostazioni({
    myName,
    selectedProvinceCode,
    onChangeProvince,
    onLogout,
    onOpenIntro,
}: Props) {
    return (
    <div style={styles.page}>
        <div style={styles.topbar}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
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
            <div />
        </div>

        <h2 style={styles.h2}>Impostazioni</h2>

        <div style={styles.cardCompact}>
            <div style={styles.label}>Utente</div>
            <div style={styles.value}>{myName || "—"}</div>
        </div>

        <div style={{ height: 10 }} />

        <div style={styles.cardCompact}>
            <div style={styles.label}>Provincia attiva</div>

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

            <div style={{ ...styles.muted, marginTop: 8 }}>
                Cambiando provincia esplori produttori di un altro territorio.
            </div>
        </div>

        <div style={{ height: 10 }} />

        <div style={styles.cardCompact}>
    <div style={{ ...styles.muted, marginBottom: 10 }}>
        Ripassa come funziona SpesaConTe.
    </div>

    <button
        type="button"
        style={styles.helpButton}
        onClick={onOpenIntro}
    >
        Come funziona in 30 secondi
    </button>
</div>

        <button
    type="button"
    style={{ ...styles.primaryButton, marginTop: 60, alignSelf: "center" }}
    onClick={onLogout}
>
    Esci
</button>
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
        display: "flex",
        justifyContent: "space-between",
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
    h2: {
        fontSize: 18,
        fontWeight: 800,
        margin: "6px 0 12px",
        color: "#D97706",
    },
    label: {
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 6,
        color: "#242827",
    },
    value: {
        fontSize: 16,
        fontWeight: 700,
        color: "#1a1a1a",
    },
    muted: {
        color: "#242827",
        fontSize: 13,
        margin: 0,
        lineHeight: 1.4,
        opacity: 0.75,
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #eee6d7",
        background: "#fff",
        fontFamily: "inherit",
    },
    cardCompact: {
        background: "#ffffff",
        borderRadius: 16,
        padding: 16,
        border: "1px solid #eee6d7",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
    },
    primaryButton: {
        alignSelf: "flex-start",
        minWidth: 160,
        padding: "12px 16px",
        borderRadius: 999,
        background: "#2f4a3d",
        color: "#fff",
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
    },
    helpButton: {
        alignSelf: "flex-start",
        minWidth: 220,
        padding: "12px 16px",
        borderRadius: 999,
        background: "#f4b183",
        color: "#5a2f12",
        fontWeight: 700,
        border: "1px solid #e39a67",
        cursor: "pointer",
    },
};