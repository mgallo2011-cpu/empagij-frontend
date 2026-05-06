import React, { useMemo, useState } from "react";

type Producer = { id: string; name: string };

type Richiesta = {
  id: string;
  producerName: string;
  fromName?: string;
  fromUserId?: string;
  itemsText: string;
  toNames: string[];
  targetUserIds: string[];
  statusByName: Record<string, "pending" | "accepted" | "declined">;
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
  onOpenCerchiaPassaggi?: () => void;
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
  onOpenCerchiaPassaggi,
  mode = "manage",
  producerId,
  producers = [],
  onCreateRequest,
  richieste = [],
  myName,
  circleMembers = [],
  setCircleMembers,
  myInvites = [],
  setMyInvites,
  refreshCircles,
  circles = [],
  activeCircleId,
  onChangeActiveCircle,
  isCreatingRichiesta,
  richiestaError,
  styles = {},
  apiBase,
  getBearerHeaders,
  apiGet,
}: FriendsProps) {
  const selecting = mode === "selectForRequest";

  const friends = useMemo(
    () => circleMembers.filter((m) => m.name && m.name !== myName),
    [circleMembers, myName]
  );

  const hasCircle = !!activeCircleId && circles.length > 0;
  const hasFriends = friends.length > 0;
  const isFull = circleMembers.length >= 5;

  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  const [newCircleName, setNewCircleName] = useState("");
  const [isCreatingCircle, setIsCreatingCircle] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const producerName = producers.find((p) => p.id === producerId)?.name || "";

  const inviteFriend = async () => {
    if (!activeCircleId || !inviteEmail.trim() || isInviting) return;

    setIsInviting(true);
    setInviteFeedback(null);

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
          body: JSON.stringify({ invitee_email: email }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setInviteEmail("");
      setInviteFeedback(
        data?.email_sent
          ? `Invito inviato a ${email}.`
          : `Invito salvato, ma email non inviata.`
      );
    } catch (err: any) {
      setInviteFeedback(String(err?.message || err));
    } finally {
      setIsInviting(false);
    }
  };

  const createCircle = async () => {
    if (!newCircleName.trim() || isCreatingCircle) return;

    setIsCreatingCircle(true);

    try {
      const res = await fetch(`${apiBase}/circles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getBearerHeaders(),
        },
        body: JSON.stringify({ name: newCircleName.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setNewCircleName("");
      await refreshCircles();
    } catch (err: any) {
      alert(String(err?.message || err));
    } finally {
      setIsCreatingCircle(false);
    }
  };

  const removeMember = async (member: CircleMember) => {
    if (!activeCircleId) return;
    if (!window.confirm(`Rimuovere ${member.name} dalla cerchia?`)) return;

    try {
      const res = await fetch(
        `${apiBase}/circles/${encodeURIComponent(
          activeCircleId
        )}/members/${encodeURIComponent(member.id)}`,
        {
          method: "DELETE",
          headers: { ...getBearerHeaders() },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      await refreshCircles();

      const membersData = await apiGet<{ ok: true; members: CircleMember[] }>(
        `/circles/${encodeURIComponent(activeCircleId)}/members`
      );

      setCircleMembers(Array.isArray(membersData.members) ? membersData.members : []);
    } catch (err: any) {
      alert(String(err?.message || err));
    }
  };
  const leaveCircle = async () => {
  if (!activeCircleId) return;

  const confirmed = window.confirm(
    "Vuoi davvero uscire da questa cerchia?"
  );

  if (!confirmed) return;

  try {
    const res = await fetch(
      `${apiBase}/circles/${encodeURIComponent(activeCircleId)}/leave`,
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

    setCircleMembers([]);
  } catch (err: any) {
    alert(String(err?.message || err));
  }
};
  const toggleUserId = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

   return (
    <div
      style={{
        ...(styles.page || {}),
        minHeight: "calc(100vh - 90px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div>
        <div style={styles.headerRow}>
          <button type="button" onClick={onBack} style={styles.back}>
            ← Indietro
          </button>
          <div style={styles.avatar}>🙂</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ ...styles.h2, marginTop: 0 }}>Le tue cerchie</h2>

          {hasCircle && (
            <button
              type="button"
              onClick={onOpenCerchiaPassaggi}
              style={{
                ...styles.secondaryBtn,
                padding: "8px 12px",
                background: "#FEFBF4",
                color: "#2F5D35",
                border: "1px solid #E6D6B3",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Chi sta andando?
            </button>
          )}
        </div>

       {hasCircle && hasFriends && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    }}
  >
    <div
      style={{
        ...styles.muted,
        whiteSpace: "nowrap",
        fontSize: 13,
      }}
    >
      Cerchia attiva
    </div>

    <select
      value={activeCircleId || ""}
      onChange={(e) => onChangeActiveCircle(e.target.value)}
      style={{
        ...styles.input,
        marginBottom: 0,
        flex: 1,
      }}
    >
      {circles.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  </div>
)}

        {hasCircle && !hasFriends && !selecting && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Per iniziare invita un amico</div>
            <div style={{ ...styles.muted, marginTop: 6 }}>
              Appena sarete in due, potrete fare la prima spesa insieme.
            </div>
          </div>
        )}

        {hasCircle && hasFriends && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {friends.map((member) => (
              <div key={member.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={styles.avatarSmall}>🙂</div>
                    <div style={styles.cardTitle}>{member.name}</div>

                    {!selecting && (
                      <button
                        type="button"
                        style={styles.btnSecondary}
                        onClick={() => removeMember(member)}
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>

                  {selecting ? (
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(member.id)}
                      onChange={() => toggleUserId(member.id)}
                    />
                  ) : (
                    <div style={styles.pill}>membro</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!selecting && (
        <div style={{ marginTop: "auto", paddingTop: 46 }}>
          {hasCircle && !isFull && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ ...styles.muted, marginBottom: 8 }}>
                {hasFriends
                  ? "Vuoi aggiungere un amico a questa cerchia?"
                  : "Email dell’amico da invitare"}
              </div>

              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email"
                style={{ ...styles.input, marginBottom: 10 }}
              />

             <button
  type="button"
  style={{
  ...styles.primaryBtn,
  width: "auto",
  minWidth: 0,
  display: "inline-flex",
  alignSelf: "flex-start",
  padding: "9px 14px",
  background: "#D97706",
  color: "#fff",
  border: "1px solid #B45309",
  boxShadow: "0 6px 18px rgba(217,119,6,0.28)",
  opacity: !inviteEmail.trim() || isInviting ? 0.6 : 1,
}}
  disabled={!inviteEmail.trim() || isInviting}
  onClick={inviteFriend}
>
  {isInviting ? "Invio..." : "Invita un amico"}
</button>
            </div>
          )}

          {inviteFeedback && (
            <div style={{ marginBottom: 14, fontSize: 13, color: "#2f4a3d" }}>
              {inviteFeedback}
            </div>
          )}

         <div
  style={{
    ...styles.card,
    marginBottom: 8,
    padding: 5,
  }}
>
  <div style={{ ...styles.muted, marginBottom: 6, fontSize: 12 }}>
    {hasCircle
      ? "Qui puoi creare una nuova cerchia"
      : "Crea la tua prima cerchia"}
  </div>

  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                placeholder="Nome Cerchia"
                style={{ ...styles.input, marginBottom: 0 }}
              />

              <button
  type="button"
  style={{
    ...styles.primaryBtn,
    minWidth: 76,
    height: 44,
    paddingTop: 0,
    paddingBottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: !newCircleName.trim() || isCreatingCircle ? 0.5 : 1,
  }}
                disabled={!newCircleName.trim() || isCreatingCircle}
                onClick={createCircle}
              >
                {isCreatingCircle ? "..." : "OK"}
              </button>
            </div>
          </div>

          <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  }}
>
  {hasCircle && hasFriends && (
    <button
      type="button"
      onClick={leaveCircle}
      style={{
        background: "transparent",
        border: "none",
        color: "#9B1C1C",
        fontSize: 13,
        cursor: "pointer",
        textDecoration: "underline",
      }}
    >
      Esci dalla cerchia
    </button>
  )}

  <div
    style={{
      ...styles.muted,
      fontSize: 12,
      textAlign: "center",
    }}
  >
    Max 5 persone per cerchia
  </div>
</div>
        </div>
      )}
    </div>
  );
}