import React, { useMemo, useState } from "react";

type Producer = {
  id: string;
  name: string;
};

type Richiesta = {
    id: string;
    producerName: string;
    fromName?: string; // solo UI
    fromUserId?: string;
    itemsText: string;
    toNames: string[]; // solo UI
    targetUserIds: string[];
    statusByName: Record<string, "pending" | "accepted" | "declined">; // solo legacy/UI
    statusByUserId: Record<string, "pending" | "accepted" | "declined">;
    status: "open" | "closed";
};

type CircleMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type InviteItem = {
  id: string;
  circle_id: string;
  circle_name: string;
  invited_by_user_id: string;
  invitee_email: string;
  status: string;
  created_at: string;
};

type Circle = {
  id: string;
  name: string;
  owner_user_id: string;
};

type FriendsProps = {
  onBack: () => void;
  mode?: "manage" | "selectForRequest";
  producerId?: string;
  producers: Producer[];
  onCreateRequest?: (payload: {
    producerId: string;
    producerName: string;
    itemsText: string;
    targetUserIds: string[];
  }) => Promise<void> | void;
  richieste: Richiesta[];
  myName: string;
    onRespondRequest: (
        requestId: string,
        userId: string,
        decision: "accepted" | "declined"
    ) => void;
  onDeleteRequest: (id: string) => void;
  circleMembers: CircleMember[];
  setCircleMembers: React.Dispatch<React.SetStateAction<CircleMember[]>>;
  myInvites: InviteItem[];
  userId: string;
  setMyInvites: React.Dispatch<React.SetStateAction<InviteItem[]>>;
  refreshCircles: () => Promise<void>;
  circles: Circle[];
  activeCircleId: string | null;
  onChangeActiveCircle: (circleId: string) => void;
    isCreatingRichiesta: boolean;
    richiestaError: string;
  styles: Record<string, React.CSSProperties>;
  apiBase: string;
  getBearerHeaders: () => Record<string, string>;
  apiGet: <T>(path: string) => Promise<T>;
};

export default function Friends({
    onBack,
    mode = "manage",
    producerId,
    producers = [],
    onCreateRequest,
    richieste = [],
    myName,
    onRespondRequest,
    onDeleteRequest,
    circleMembers = [],
    setCircleMembers,
    myInvites = [],
    userId,
    setMyInvites,
    refreshCircles,
    circles = [],
    activeCircleId,
    onChangeActiveCircle,
    isCreatingRichiesta,
    richiestaError,
    styles = {} as Record<string, React.CSSProperties>,
    apiBase,
    getBearerHeaders,
    apiGet,
}: FriendsProps) {
    const selecting = mode === "selectForRequest";

      const received = !selecting
      ? richieste.filter((r) => {
          const ids = Array.isArray(r.targetUserIds) ? r.targetUserIds : [];
          return ids.includes(userId);
      })
      : [];

    const selectableMembers = useMemo(
        () =>
            circleMembers.filter(
                (m) => (m.name || "").trim().length > 0 && m.name !== myName
            ),
        [circleMembers, myName]
    );

    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [itemsText, setItemsText] = useState("");
    const [draft, setDraft] = useState("");
    const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
       const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteFeedback, setInviteFeedback] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [newCircleName, setNewCircleName] = useState("");
    const [isCreatingCircle, setIsCreatingCircle] = useState(false);

    const toggleUserId = (id: string) => {
        setSelectedUserIds((prev) =>
            prev.indexOf(id) >= 0 ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const producerName =
        producers.find((p) => p.id === producerId)?.name || "";

    const memberNameById = useMemo(
        () =>
            Object.fromEntries(
                circleMembers.map((member) => [member.id, member.name || ""])
            ) as Record<string, string>,
        [circleMembers]
    );
  return (
      <div style={styles?.page || {}}>
      <div style={styles.headerRow}>
        <button type="button" onClick={onBack} style={styles.back}>
          ← Indietro
        </button>
        <div style={styles.avatar}>🙂</div>
      </div>

      <h2 style={styles.h2}>La tua cerchia</h2>

          {activeCircleId && (
              <div
                  style={{
                      marginBottom: 14,
                      fontSize: 14,
                      lineHeight: 1.5,
                      background: "#f7f3ec",
                      border: "1px solid #eee6d7",
                      borderRadius: 14,
                      padding: 14,
                  }}
              >
                  <div>
                      Sei parte di questa cerchia:{" "}
                      <strong>
                          {circles.find((c) => c.id === activeCircleId)?.name || "—"}
                      </strong>
                  </div>

                  <div style={{ marginTop: 6, opacity: 0.75 }}>
                      Ogni cerchia può contenere massimo 5 utenti.
                  </div>
              </div>
          )}
         
            {!selecting && activeCircleId && circleMembers.length < 5 && (
          <div style={{ marginBottom: 12 }}>
                  <div style={{ ...styles.muted, marginBottom: 6 }}>
                      Per iniziare davvero, invita una persona con la sua email.
                  </div>
          <input
                  value={inviteEmail}
                  onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (inviteFeedback) setInviteFeedback(null);
                  }}
                  placeholder="email della persona da invitare"
                  style={{ ...styles.input, marginBottom: 8 }}
              />

              <button
                  type="button"
                      style={{
                          ...styles.primaryBtn,
                          background: "#1b2f25",
                          color: "#ffffff",
                          border: "1px solid #16271f",
                          boxShadow: "0 6px 18px rgba(27,47,37,0.34)",
                          opacity: !inviteEmail.trim() || isInviting ? 0.82 : 1,
                      }}
                  disabled={!inviteEmail.trim() || isInviting}
                  onClick={async () => {
                      if (!activeCircleId) return;

                      setInviteFeedback(null);
                      setIsInviting(true);

                      try {
                          const email = inviteEmail.trim();

                          const res = await fetch(
                              `${apiBase}/circles/${encodeURIComponent(activeCircleId)}/invite`,
                              {
                                  method: "POST",
                                  headers: {
                                      "Content-Type": "application/json",
                                      ...getBearerHeaders(),
                                  },
                                  body: JSON.stringify({
                                      invitee_email: email,
                                  }),
                              }
                          );

                          const data = await res.json().catch(() => ({}));

                          if (!res.ok || data?.ok === false) {
                              throw new Error(data?.error || `HTTP ${res.status}`);
                          }

                                                    setInviteEmail("");

            if (data?.email_sent) {
                setInviteFeedback({
                    type: "success",
                    text:
                        `Invito inviato a ${email}. ` +
                        `La persona riceverà un'email con il link per entrare nella cerchia.`,
                });
            } else {
                setInviteFeedback({
                    type: "error",
                    text:
                        `Invito salvato per ${email}, ma l'email non è stata inviata. ` +
                        `Errore: ${data?.email_error || "invio email non disponibile"}`,
                });
            }
                      } catch (err: any) {
                          console.error("Errore invito:", err);
                          setInviteFeedback({
                              type: "error",
                              text: String(err?.message || err),
                          });
                      } finally {
                          setIsInviting(false);
                      }
                  }}
              >
                      {isInviting ? "Invio..." : "Invita una persona"}
              </button>

              {inviteFeedback && (
                  <div
                      style={{
                          marginTop: 8,
                          fontSize: 13,
                          lineHeight: 1.45,
                          color:
                              inviteFeedback.type === "error"
                                  ? "crimson"
                                  : "#2f4a3d",
                      }}
                  >
                      {inviteFeedback.text}
                  </div>
              )}
          </div>
      )}
          {circles.length === 0 && (
              <div style={styles.card}>
                  <div style={styles.cardTitle}>
                      Per iniziare servono 2–3 persone
                  </div>
                  <div style={{ ...styles.muted, marginTop: 6 }}>
                      Crea la tua prima cerchia e invita almeno una persona.
                  </div>

                  <div style={{ marginTop: 12 }}>
                      <input
                          value={newCircleName}
                          onChange={(e) => setNewCircleName(e.target.value)}
                          placeholder="Nome della cerchia"
                          style={{ ...styles.input, marginBottom: 8 }}
                      />

                      <button
                          type="button"
                          style={{
                              ...styles.primaryBtn,
                              opacity: !newCircleName.trim() || isCreatingCircle ? 0.5 : 1,
                          }}
                          disabled={!newCircleName.trim() || isCreatingCircle}
                          onClick={async () => {
                              setIsCreatingCircle(true);

                              try {
                                  const res = await fetch(`${apiBase}/circles`, {
                                      method: "POST",
                                      headers: {
                                          "Content-Type": "application/json",
                                          ...getBearerHeaders(),
                                      },
                                      body: JSON.stringify({
                                          name: newCircleName.trim(),
                                      }),
                                  });

                                  const data = await res.json().catch(() => ({}));

                                  if (!res.ok || data?.ok === false) {
                                      throw new Error(data?.error || `HTTP ${res.status}`);
                                  }

                                  await refreshCircles();
                                  setNewCircleName("");
                              } catch (err: any) {
                                  console.error("Errore creazione cerchia:", err);
                              } finally {
                                  setIsCreatingCircle(false);
                              }
                          }}
                      >
                          {isCreatingCircle ? "Creazione..." : "Crea la prima cerchia"}
                      </button>
                  </div>
              </div>
          )}

      {circles.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ ...styles.muted, marginBottom: 6 }}>
            Cerchia attiva
          </div>

          <select
            value={activeCircleId || ""}
            onChange={(e) => onChangeActiveCircle(e.target.value)}
            style={styles.input}
          >
            {circles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!selecting && myInvites.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: 0.4,
              opacity: 0.7,
            }}
          >
            INVITI RICEVUTI
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {myInvites.map((inv) => (
              <div key={inv.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.avatarSmall}>📩</div>

                  <div style={{ flex: 1 }}>
                    <div style={styles.cardTitle}>
                      {inv.circle_name || "Cerchia"}
                    </div>
                    <div style={styles.cardSub}>Invito in attesa</div>
                  </div>

                  <button
                    type="button"
                                       style={{
                      ...styles.primaryButton,
                      background: "#2f4a3d",
                      color: "#fff",
                      fontWeight: 800,
                      border: "2px solid #2f4a3d",
                      boxShadow: "0 6px 16px rgba(47,74,61,0.28)",
                    }}
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `${apiBase}/invites/${encodeURIComponent(inv.id)}/accept`,
                          {
                            method: "POST",
                            headers: {
                              ...getBearerHeaders(),
                            },
                          }
                        );

                        const data = await res.json().catch(() => ({}));

                        if (!res.ok || data?.ok === false) {
                          throw new Error(data?.error || `HTTP ${res.status}`);
                        }

                        setMyInvites((prev) =>
                          prev.filter((x) => x.id !== inv.id)
                        );
                        await refreshCircles();
                        alert("Invito accettato");
                      } catch (err: any) {
                        alert(String(err?.message || err));
                      }
                    }}
                  >
                    Accetta
                  </button>

                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `${apiBase}/invites/${encodeURIComponent(inv.id)}/decline`,
                          {
                            method: "POST",
                            headers: {
                              ...getBearerHeaders(),
                            },
                          }
                        );

                        const data = await res.json().catch(() => ({}));

                        if (!res.ok || data?.ok === false) {
                          throw new Error(data?.error || `HTTP ${res.status}`);
                        }

                        setMyInvites((prev) =>
                          prev.filter((x) => x.id !== inv.id)
                        );
                        alert("Invito rifiutato");
                      } catch (err: any) {
                        alert(String(err?.message || err));
                      }
                    }}
                  >
                    Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

          {!selecting && (
              <div style={{ marginBottom: 12 }}>
                  <div style={{ marginTop: 12 }}>
                      <div
                          style={{
                              fontWeight: 800,
                              fontSize: 12,
                              letterSpacing: 0.4,
                              opacity: 0.7,
                          }}
                      >
                          LE TUE RICHIESTE
                      </div>

                      {richieste.filter((r) => r.fromUserId === userId).length === 0 ? (
                          <div style={{ marginTop: 10 }}>
                              <div style={styles.card}>
                                  <div style={styles.cardTitle}>Non hai ancora creato richieste</div>
                                  <div style={{ ...styles.muted, marginTop: 6 }}>
                                      Quando chiederai qualcosa a una persona della tua cerchia, lo vedrai qui.
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                              {richieste
                                  .filter((r) => r.fromUserId === userId)
                                  .map((r) => {
                                      const isClosed = r.status === "closed";

                                      return (
                                          <div
                                              key={r.id}
                                              style={{
                                                  ...styles.card,
                                                  padding: 12,
                                                  borderRadius: 12,
                                                  ...(isClosed ? { background: "#fffaf2" } : {}),
                                              }}
                                          >
                                              <div style={styles.cardTop}>
                                                  <div style={styles.avatarSmall}>🙂</div>

                                                  <div style={{ flex: 1 }}>
                                                      <div style={styles.cardTitle}>
                                                          {r.producerName || "Produttore"}
                                                      </div>

                                                      <div
                                                          style={{
                                                              ...styles.cardSub,
                                                              marginTop: 2,
                                                              display: "flex",
                                                              flexWrap: "wrap",
                                                              gap: 6,
                                                          }}
                                                      >
                                                          <span>
                                                              {r.fromName?.trim() ? r.fromName : "Anonimo"}
                                                          </span>

                                                          <span>→</span>

                                                          <span>
                                                              {r.targetUserIds && r.targetUserIds.length > 0
                                                                  ? r.targetUserIds
                                                                      .map((targetUserId) => {
                                                                          const displayName =
                                                                              memberNameById[targetUserId] || "Utente";
                                                                          const s = r.statusByUserId?.[targetUserId];

                                                                          const label =
                                                                              s === "accepted"
                                                                                  ? "✅"
                                                                                  : s === "declined"
                                                                                      ? "❌"
                                                                                      : "⏳";

                                                                          return `${displayName} ${label}`;
                                                                      })
                                                                      .join(", ")
                                                                  : "—"}
                                                          </span>
                                                      </div>

                                                      <div style={{ ...styles.cardQuote, marginTop: 2 }}>
                                                          “{r.itemsText?.trim() ? r.itemsText : "Richiesta"}”
                                                      </div>
                                                  </div>

                                                  <button
                                                      type="button"
                                                      style={styles.btnSecondary}
                                                      onClick={() => {
                                                          if (
                                                              !window.confirm("Eliminare questa richiesta?")
                                                          ) {
                                                              return;
                                                          }
                                                          onDeleteRequest(r.id);
                                                      }}
                                                  >
                                                      Elimina richiesta
                                                  </button>

                                                  <div style={styles.pill}>
                                                      {isClosed ? "chiusa" : "aperta"}
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                          </div>
                      )}
                  </div>
              </div>
          )}

          {selectableMembers.length === 0 ? (
              <div style={styles.card}>
                  <div style={styles.cardTitle}>Per iniziare servono 2–3 persone</div>
                  <div style={{ ...styles.muted, marginTop: 6 }}>
                      In questa cerchia non ci sono ancora altri membri disponibili.
                  </div>
                  <div style={{ ...styles.muted, marginTop: 6 }}>
                      Invita almeno una persona così potrete iniziare a usarla davvero.
                  </div>
              </div>
          ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selecting && (
                        <div style={{ ...styles.muted, marginBottom: 10 }}>
                            Seleziona una o più persone della cerchia.
                        </div>
                    )}

                    {selecting && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ ...styles.muted, marginBottom: 6 }}>
                                Cosa ti serve dal produttore?
                            </div>
                            <input
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder='Es. "2 orecchiette + 1 pacco ceci"'
                                style={styles.input}
                            />
                        </div>
                    )}

                      {!selecting && (
                          <div style={{ marginBottom: 14 }}>
                              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                                  Richieste ricevute
                              </div>

                              {received.length === 0 ? (
                                  <div style={styles.card}>
                                      <div style={styles.cardTitle}>Ancora nessuna richiesta ricevuta</div>
                                      <div style={{ ...styles.muted, marginTop: 6 }}>
                                          Quando una persona della tua cerchia ti chiederà qualcosa, lo vedrai qui.
                                      </div>
                                  </div>
                              ) : (
                                  received.map((r) => {
                                      const myDecision = r.statusByUserId?.[userId] || "pending";
                                      const isPending = myDecision === "pending";

                                      return (
                                          <div
                                              key={r.id}
                                              style={{
                                                  ...styles.card,
                                                  padding: "10px 12px",
                                                  borderRadius: 12,
                                                  minHeight: "unset",
                                                  ...(!isPending ? { background: "#fffaf2" } : {}),
                                              }}
                                          >
                                              <div style={{ fontWeight: 800 }}>{r.producerName}</div>

                                              <div style={{ marginTop: 4 }}>
                                                  <div
                                                      style={{
                                                          fontSize: 12,
                                                          opacity: 1,
                                                          color: "#2f281f",
                                                          marginBottom: 0,
                                                          lineHeight: "14px",
                                                      }}
                                                  >
                                                      <div>Da: {r.fromName || "Un amico"}</div>
                                                      <div>Prodotto: {r.itemsText?.trim() ? r.itemsText : "-"}</div>
                                                      <div style={{ marginTop: 4, fontWeight: 700, fontSize: 12 }}>
                                                          Stato:{" "}
                                                          {myDecision === "accepted"
                                                              ? "✅ Hai accettato"
                                                              : myDecision === "declined"
                                                                  ? "❌ Hai rifiutato"
                                                                  : "⏳ In attesa"}
                                                      </div>
                                                  </div>

                                                  {isPending ? (
                                                      <>
                                                          <button
                                                              type="button"
                                                              style={styles.primaryButton}
                                                              onClick={() => onRespondRequest(r.id, userId, "accepted")}
                                                          >
                                                              Sì certo
                                                          </button>
                                                          <button
                                                              type="button"
                                                              style={styles.secondaryButton}
                                                              onClick={() => onRespondRequest(r.id, userId, "declined")}
                                                          >
                                                              No, mi spiace
                                                          </button>
                                                      </>
                                                  ) : null}
                                              </div>
                                          </div>
                                      );
                                  })
                              )}
                          </div>
                      )}

                    {selectableMembers.map((member) => (
                        <div key={member.id} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={styles.avatarSmall}>🙂</div>
                                    <div style={styles.cardTitle}>{member.name}</div>

                                    {!selecting && (
                                        <button
                                            type="button"
                                            style={styles.btnSecondary}
                                            onClick={async () => {
                                                if (!activeCircleId) return;

                                                if (
                                                    !window.confirm(
                                                        `Rimuovere ${member.name} dalla cerchia?`
                                                    )
                                                ) {
                                                    return;
                                                }

                                                try {
                                                    const res = await fetch(
                                                        `${apiBase}/circles/${encodeURIComponent(
                                                            activeCircleId
                                                        )}/members/${encodeURIComponent(member.id)}`,
                                                        {
                                                            method: "DELETE",
                                                            headers: {
                                                                ...getBearerHeaders(),
                                                            },
                                                        }
                                                    );

                                                    const data = await res.json().catch(() => ({}));

                                                    if (!res.ok || data?.ok === false) {
                                                        throw new Error(data?.error || `HTTP ${res.status}`);
                                                    }

                                                    await refreshCircles();

                                                    if (data?.circle_deleted) {
                                                        onBack();
                                                        return;
                                                    }

                                                    const membersData = await apiGet<{
                                                        ok: true;
                                                        members: CircleMember[];
                                                    }>(
                                                        `/circles/${encodeURIComponent(
                                                            activeCircleId
                                                        )}/members`
                                                    );

                                                    const nextMembers: CircleMember[] = Array.isArray(
                                                        membersData.members
                                                    )
                                                        ? membersData.members
                                                        : [];

                                                    setCircleMembers(nextMembers);
                                                } catch (err: any) {
                                                    alert(String(err?.message || err));
                                                }
                                            }}
                                        >
                                            Rimuovi
                                        </button>
                                    )}
                                </div>

                                {selecting ? (
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.indexOf(member.id) >= 0}
                                        onChange={() => toggleUserId(member.id)}
                                    />
                                ) : (
                                    <div style={styles.pill}>membro</div>
                                )}
                            </div>
                        </div>
                    ))}

                    {selecting && (
                        <div style={{ marginTop: 20 }}>
                            <button
                                type="button"
                                style={{
                                    ...styles.primaryButton,
                                    opacity:
                                        isSubmittingLocal ||
                                            isCreatingRichiesta ||
                                            selectedUserIds.length === 0 ||
                                            !(draft || "").trim()
                                            ? 0.5
                                            : 1,
                                    cursor:
                                        isSubmittingLocal ||
                                            isCreatingRichiesta ||
                                            selectedUserIds.length === 0 ||
                                            !(draft || "").trim()
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                                disabled={
                                    isSubmittingLocal ||
                                    isCreatingRichiesta ||
                                    selectedUserIds.length === 0 ||
                                    !(draft || "").trim()
                                }
                                onClick={async () => {
                                    if (
                                        isSubmittingLocal ||
                                        isCreatingRichiesta ||
                                        selectedUserIds.length === 0 ||
                                        !(draft || "").trim()
                                    ) {
                                        return;
                                    }

                                    setIsSubmittingLocal(true);

                                    try {
                                        await onCreateRequest?.({
                                            producerId: producerId || "",
                                            producerName: producerName || "",
                                            itemsText: (draft || "").trim(),
                                            targetUserIds: selectedUserIds,
                                        });

                                        onBack();
                                    } catch (err) {
                                        console.error("Errore invio richiesta:", err);
                                    } finally {
                                        setIsSubmittingLocal(false);
                                    }
                                }}
                            >
                                {isSubmittingLocal || isCreatingRichiesta
                                    ? "Invio..."
                                    : "Invia richiesta"}
                              </button>
                              {richiestaError && (
                                  <div style={{ color: "crimson", marginTop: 8, fontSize: 13 }}>
                                      {richiestaError}
                                  </div>
                              )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}