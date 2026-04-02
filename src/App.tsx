import { useEffect, useMemo, useRef, useState } from "react";
import BottomNav from "./components/BottomNav";
import InfoCard from "./components/InfoCard";
import ProducerCard from "./components/ProducerCard";
import Friends from "./components/Friends";
import Impostazioni from "./components/Impostazioni";
import Home from "./components/Home";
import Disponibilita from "./components/Disponibilita";
import Cerchia from "./components/Cerchia";
import { PROVINCES } from "./data/provinces";
type Tab = "home" | "cerchia" | "disponibilita" | "impostazioni";
type Screen =
  | { name: "tabs"; tab: Tab }
 | {
    name: "cerchia";
    mode?: "manage" | "selectForRequest";
    producerId?: string;
    from?: Tab;
  }
  | { name: "intro" }
  | { name: "producerDetail"; producer: Producer; fromTab: Tab }
  | { name: "stoAndando"; producer: Producer; fromTab: Tab }
  | { name: "miaArea" }
  | { name: "piccolaRichiesta"; fromTab: Tab }
  | { name: "producersFollowed"; mode: "browse" | "stoAndando" }
  | { name: "producerOnboarding"; fromTab: Tab }
  | { name: "producerAdd" }
  | { name: "passaggi" }
  | { name: "cerchiaPassaggi" }
  | {
      name: "friends";
      fromTab: Tab;
      mode?: "manage" | "selectForRequest";
      producerId?: string;
    }
  | { name: "joinPassaggio"; passaggioId: string };
type ProducerDraft = {
  name: string;
  category: string;
  city: string;
  address: string;
  google_maps_url: string;
  website_url: string;
  notes: string;
};

type WhenChoice = "oggi" | "domani" | "altra";

type Passaggio = {
  id: string;
  circleId: string;
    producerId: string;
    fromName: string;
    fromUserId: string;
  producerName: string;
  friendName?: string;
  producerCategory: string;
  createdAtISO: string;
  whenLabel: "Oggi" | "Domani" | "Altra data";
  dateISO?: string; // solo se "Altra data"
  note: string;
  createdAt: number;
};
type Richiesta = {
    id: string;
    createdAt: number;
    circleId: string;
    producerId: string;
    producerName: string;
    fromUserId: string;
    fromName?: string; // solo UI
    itemsText: string;
    toNames: string[]; // solo UI
    targetUserIds: string[];
    statusByName: Record<string, "pending" | "accepted" | "declined">; // solo UI/legacy
    statusByUserId: Record<string, "pending" | "accepted" | "declined">;
    status: "open" | "closed";
};
function mapBackendRichieste(items: any[]): Richiesta[] {
    const parseStringArray = (value: any): string[] => {
        if (!value) return [];

        if (Array.isArray(value)) {
            return value.map((x) => String(x).trim()).filter(Boolean);
        }

        if (typeof value === "string") {
            const trimmed = value.trim();
            if (!trimmed) return [];

            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.map((x) => String(x).trim()).filter(Boolean);
                }
            } catch {
                // non è JSON, continuo sotto
            }

            return trimmed
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }

        return [];
    };

    const parseStatusMap = (
        value: any
    ): Record<string, "pending" | "accepted" | "declined"> => {
        if (!value) return {};

        let raw: any = value;

        if (typeof value === "string") {
            try {
                raw = JSON.parse(value);
            } catch {
                return {};
            }
        }

        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
            return {};
        }

        const out: Record<string, "pending" | "accepted" | "declined"> = {};

        Object.entries(raw).forEach(([key, val]) => {
            out[key] =
                val === "accepted" || val === "declined" ? val : "pending";
        });

        return out;
    };

    return items.map((x) => {
        const toNames = parseStringArray(x.target_names);
        const targetUserIds = parseStringArray(x.target_user_ids);
        const rawStatusMap = parseStatusMap(x.target_status_map);

        const statusByName: Record<string, "pending" | "accepted" | "declined"> = {};
        const statusByUserId: Record<string, "pending" | "accepted" | "declined"> = {};

        targetUserIds.forEach((targetUserId: string, index: number) => {
            const normalizedStatus = rawStatusMap[targetUserId] || "pending";

            statusByUserId[targetUserId] = normalizedStatus;

            const uiName = toNames[index];
            if (uiName) {
                statusByName[uiName] = normalizedStatus;
            }
        });

        return {
            id: x.id,
            createdAt: x.created_at ? new Date(x.created_at).getTime() : Date.now(),
            circleId: x.circle_id,
            producerId: x.producer_id,
            producerName: x.producer_name,
            fromUserId: x.from_user_id || "",
            fromName: x.from_name || "",
            itemsText: x.request_text || "",
            toNames,
            targetUserIds,
            statusByName,
            statusByUserId,
            status: x.status === "closed" ? "closed" : "open",
        };
    });
}
 type AuthUser = {
  id: string;
  name: string;
  email: string;
  selected_province_code: string;
};
type Circle = {
  id: string;
  name: string;
  owner_user_id: string;
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
function formatDateIT(dateISO?: string) {
  if (!dateISO) return "";
  const d = dateISO.includes("T") ? dateISO.slice(0, 10) : dateISO; // prende YYYY-MM-DD
  const parts = d.split("-");
  if (parts.length !== 3) return dateISO;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
}
const API_BASE = "https://empagij-backend-delsud.onrender.com";
async function apiPost<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getBearerHeaders(),
        },
        body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
    }
    return data as T;
}
async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
        ...getBearerHeaders(),
    },
});

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
    }
    return data as T;
}
function getStoredToken(): string {
    try {
        return localStorage.getItem(LS_TOKEN) || "";
    } catch {
        return "";
    }
}

function getBearerHeaders(): Record<string, string> {
    const token = getStoredToken();

    if (!token) return {};

    return {
        Authorization: `Bearer ${token}`,
    };
}
type ProducersResponse = {
    ok: true;
    producers: Producer[];
};
async function acceptInviteTokenIfPresent(): Promise<void> {
    try {
        const inviteToken = localStorage.getItem("empagij_invite_token") || "";

        if (!inviteToken) return;

        const res = await fetch(`${API_BASE}/invites/accept-by-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getBearerHeaders(),
            },
            body: JSON.stringify({
                token: inviteToken,
            }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.ok === false) {
            throw new Error(data?.error || `HTTP ${res.status}`);
        }

        localStorage.removeItem("empagij_invite_token");

        try {
            const url = new URL(window.location.href);
            url.searchParams.delete("invite_token");
            window.history.replaceState({}, "", url.toString());
        } catch { }
    } catch (err) {
        console.error("Errore accept invite by token:", err);
        throw err;
    }
}
async function fetchProducers(provinceCode?: string): Promise<Producer[]> {
    if (!provinceCode) return [];

    const data = await apiGet<ProducersResponse>(
        `/producers?province_code=${encodeURIComponent(provinceCode)}`
    );

    const list = Array.isArray(data.producers) ? data.producers : [];

    return list.map((p: any) => ({
        id: p.id,
        name: p.name || "",
        category: p.category || "",
        province_code: p.province_code || "",
        address: p.address || null,
        city: p.city || null,
        google_maps_url: p.google_maps_url || null,
        website_url: p.website_url || null,
        notes: p.notes || null,
    }));
}
const LS_PASSAGGI = "empagij_passaggi_v1";
const LS_PRODUCERS = "empagij_producers_v1";
const LS_USER = "empagij_user";
const LS_TOKEN = "empagij_token";

function loadPassaggi(): Passaggio[] {
  try {
    const raw = localStorage.getItem(LS_PASSAGGI);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function savePassaggi(list: Passaggio[]) {
  localStorage.setItem(LS_PASSAGGI, JSON.stringify(list));
}

async function addPassaggio(userId: string, p: Omit<Passaggio, "id">) {
    const newItem: Passaggio = {
        ...p,
        fromName: (p.fromName || "").trim() ? p.fromName : "Anonimo",
        fromUserId: p.fromUserId || userId,
        id: "",
        createdAtISO: new Date().toISOString(),
    };

    const res: any = await apiPost("/passaggi", {
    circle_id: newItem.circleId,
    from_name: newItem.fromName,
    producer_id: newItem.producerId,
    producer_name: newItem.producerName,
    producer_category: newItem.producerCategory,
    when_label: newItem.whenLabel,
    date_iso: newItem.dateISO || null,
    note: newItem.note || null,
    status: "in_corso",
});
    newItem.id = res.id;

    // ✅ salva in localStorage (senza setPassaggi qui, perché è fuori da App)
    const next = [newItem, ...loadPassaggi()];
    savePassaggi(next);

    return newItem;
}
async function deletePassaggio(id: string) {
    const res = await fetch(`${API_BASE}/passaggi/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
            ...getBearerHeaders(),
        },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
    }

    const list = loadPassaggi();
    savePassaggi(list.filter((p) => p.id !== id));
}

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
const PRODUCERS: Producer[] = [
  {
  id: "pirro",
  name: "Cantine Pirro",
  category: "vino",
  province_code: "FG",
  address: "Troia",
  city: null,
  google_maps_url: null,
  website_url: null,
  notes: "Nero di Troia DOC, vini rossi, rosati e bianchi",
},
  {
  id: "carrino",
  name: "Carrino",
  category: "formaggi",
  province_code: "FG",
  address: "Contrada Pavoni",
  city: "Lucera",
  google_maps_url: null,
  website_url: null,
  notes: "Olio, formaggio pecorino e lana",
},
{
  id: "daunia",
  name: "Daunia & Bio",
  category: "farine_pasta",
  province_code: "FG",
  address: "Viale Fortore 9/A",
  city: "Foggia",
  google_maps_url: null,
  website_url: null,
  notes: "Pasta + vini, olio, conserve e altri prodotti",
},
];
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
export default function App() {
    const publishingRef = useRef(false);
    const loadingPassaggiRef = useRef(false);
    const loadingRichiesteRef = useRef(false);
    const [isCreatingRichiesta, setIsCreatingRichiesta] = useState(false);
    const [richiestaError, setRichiestaError] = useState<string>("");
    const [screen, setScreen] = useState<Screen>(() => {
        const seen = localStorage.getItem("empagij_hasSeenIntro") === "1";
        return seen ? { name: "tabs", tab: "home" } : { name: "intro" };
    });
  const [producerDraft, setProducerDraft] = useState<ProducerDraft>({
  name: "",
  category: "",
  city: "",
  address: "",
  google_maps_url: "",
  website_url: "",
  notes: "",
});
const [isSavingProducer, setIsSavingProducer] = useState(false);
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
        const handleRespondRequest = async (
  requestId: string,
  userId: string,
  status: "accepted" | "declined"
) => {
  try {
    const res = await fetch(
      `${API_BASE}/richieste/${encodeURIComponent(requestId)}/respond`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getBearerHeaders(),
        },
        body: JSON.stringify({
          decision: status,
        }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
      console.error("RESPOND ERROR:", data, res.status);
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
      if (!activeCircleId) {
          throw new Error("Cerchia attiva non trovata");
      }
      try {
          const out = await apiGet<{ ok: true; items: any[] }>(
              `/richieste?circle_id=${encodeURIComponent(activeCircleId)}`
          );

          const items = Array.isArray(out.items) ? out.items : [];
          setRichieste(mapBackendRichieste(items));
      } catch (err) {
          console.error("Errore reload richieste:", err);
      }
  } catch (err: any) {
    console.error("FRONT RESPOND ERROR:", err);
    alert("Errore nella risposta alla richiesta");
  }
};

  // DISATTIVATO: le richieste ora sono gestite dal backend
  

  const [lastTab, setLastTab] = useState<Tab>("home");
  
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const raw = localStorage.getItem(LS_USER);
            return raw ? (JSON.parse(raw) as AuthUser) : null;
        } catch {
            return null;
        }
    });
const [circles, setCircles] = useState<Circle[]>([]);
const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
const [myInvites, setMyInvites] = useState<InviteItem[]>([]);
useEffect(() => {
    try {
        const params = new URLSearchParams(window.location.search);
        const inviteToken = params.get("invite_token");

        if (inviteToken) {
            localStorage.setItem("empagij_invite_token", inviteToken);
        }
    } catch (err) {
        console.error("Errore parsing invite_token:", err);
    }
}, []);
useEffect(() => {
  let alive = true;

  const loadRichieste = async () => {
    try {
      if (!user?.id || !activeCircleId) {
        if (!alive) return;
        setRichieste([]);
        return;
      }

      if (loadingRichiesteRef.current) return;
      loadingRichiesteRef.current = true;

      const out = await apiGet<{ ok: true; items: any[] }>(
        `/richieste?circle_id=${encodeURIComponent(activeCircleId)}`
      );

      if (!alive) return;

      const items = Array.isArray(out.items) ? out.items : [];
      setRichieste(mapBackendRichieste(items));
    } catch (err) {
      console.error("Errore caricamento richieste:", err);
      if (!alive) return;
      setRichieste([]);
    } finally {
      loadingRichiesteRef.current = false;
    }
  };

  loadRichieste();

  const intervalId = window.setInterval(() => {
    loadRichieste();
  }, 10000);

  return () => {
    alive = false;
    window.clearInterval(intervalId);
  };
}, [user?.id, activeCircleId]);
    useEffect(() => {
        try {
            if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
            else localStorage.removeItem(LS_USER);
        } catch { }
    }, [user]);
useEffect(() => {
    let alive = true;

    async function loadMyCircles() {
        if (!user?.id) {
            setCircles([]);
            setActiveCircleId(null);
            setCircleMembers([]);
            setMyInvites([]);
            return;
        }

        try {
          const data = await apiGet<{ ok: true; circles: Circle[] }>("/circles/mine");

           const list: Circle[] = Array.isArray(data.circles) ? data.circles : [];

            if (!alive) return;

            setCircles(list);

            setActiveCircleId((prev) => {
                if (prev && list.some((c) => c.id === prev)) return prev;
                return list.length > 0 ? list[0].id : null;
            });
        } catch (err) {
            console.error("Errore caricamento cerchie:", err);
            if (!alive) return;
            setCircles([]);
            setActiveCircleId(null);
        }
    }

    loadMyCircles();

    return () => {
        alive = false;
    };
}, [user?.id]);
useEffect(() => {
    let alive = true;

    async function loadCircleMembers() {
        if (!activeCircleId || !user?.id) {
            setCircleMembers([]);
            return;
        }

        try {
            const data = await apiGet<{ ok: true; members: CircleMember[] }>(
                `/circles/${encodeURIComponent(activeCircleId)}/members`
            );

            const list: CircleMember[] = Array.isArray(data.members) ? data.members : [];

            if (!alive) return;
            setCircleMembers(list);
        } catch (err) {
            console.error("Errore caricamento membri cerchia:", err);
            if (!alive) return;
            setCircleMembers([]);
        }
    }

    loadCircleMembers();

    return () => {
        alive = false;
    };
}, [activeCircleId, user?.id]);
    useEffect(() => {
        if (!user?.id) return;

        refreshCircles().catch((err) => {
            console.error("Errore refresh cerchie:", err);
        });
    }, [user?.id]);
useEffect(() => {
    let alive = true;

    async function loadMyInvites() {
        if (!user?.id) {
            if (!alive) return;
            setMyInvites([]);
            return;
        }

        try {
            const data = await apiGet<{ ok: true; invites: InviteItem[] }>("/invites/mine");

            const list: InviteItem[] = Array.isArray(data.invites) ? data.invites : [];

            if (!alive) return;
            setMyInvites(list);
        } catch (err) {
            console.error("Errore caricamento inviti:", err);
            if (!alive) return;
            setMyInvites([]);
        }
    }

    loadMyInvites();

    const intervalId = window.setInterval(() => {
        loadMyInvites();
    }, 10000);

    return () => {
        alive = false;
        window.clearInterval(intervalId);
    };
}, [user?.id]);

    // Manteniamo myName per compatibilità col resto dell'app
    const myName = user?.name || "";
    const [producers, setProducers] = useState<Producer[]>([]);
    useEffect(() => {
        try {
            localStorage.setItem(LS_PRODUCERS, JSON.stringify(producers));
        } catch { }
    }, [producers]);
    useEffect(() => {
    let alive = true;

    if (!user?.id) {
        setProducers([]);
        return () => {
            alive = false;
        };
    }

    fetchProducers(user.selected_province_code)
        .then((list) => {
            if (alive) setProducers(list);
        })
        .catch((err) => {
            console.error("Errore caricamento produttori:", err);
        });

    return () => {
        alive = false;
    };
}, [user?.selected_province_code]);

    const [followedProducerIds, setFollowedProducerIds] = useState<string[]>(() => {
        try {
            return JSON.parse(
                localStorage.getItem("empagij_followedProducerIds") || "[]"
            );
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(
                "empagij_followedProducerIds",
                JSON.stringify(followedProducerIds)
            );
        } catch { }
    }, [followedProducerIds]);
    const onToggleFollow = (producerId: string) => {
        setFollowedProducerIds((prev) =>
            prev.includes(producerId)
                ? prev.filter((id) => id !== producerId)
                : [...prev, producerId]
        );
    };
  
    // quante richieste "aperte" risultano pendenti per uno specifico amico
    function pendingCountForFriend(
        friendUserId: string,
        richieste: Richiesta[]
    ) {
        return richieste.filter((r) => {
            if (r.status !== "open") return false;
            return Array.isArray(r.targetUserIds) && r.targetUserIds.includes(friendUserId);
        }).length;
    }
  // totale richieste pendenti nella cerchia
const pendingCerchiaCount = richieste.filter((r) => r.status === "open").length;
const myNameLocal = (myName || "Gina").trim();

const pendingRicevuteCount = richieste.filter((r) => {
  if (r.status !== "open") return false;
  return (r.targetUserIds || []).includes(user?.id || "");
}).length;
  const onDeletePiccolaRichiesta = (_id: string) => {
  // LEGACY disattivato
};

const onClosePiccolaRichiesta = (_id: string) => {
  // LEGACY disattivato
};
  const [passaggi, setPassaggi] = useState<Passaggio[]>(() => {
    const safeLoad: (() => Passaggio[]) | null =
      typeof loadPassaggi === "function" ? loadPassaggi : null;

    return safeLoad ? safeLoad() : [];
  });
   useEffect(() => {
    let alive = true;

    if (loadingPassaggiRef.current) return;
    loadingPassaggiRef.current = true;

    (async () => {
        try {
            if (!user?.id || !activeCircleId) {
                if (alive) {
                    setPassaggi([]);
                    savePassaggi([]);
                }
                return;
            }

            const out = await apiGet<{ ok: true; items: any[] }>(
                `/passaggi?circle_id=${encodeURIComponent(activeCircleId)}`
            );

            const items: any[] = Array.isArray(out.items) ? out.items : [];

            const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

            const mapped = items
                .filter((x) => x.status === "in_corso")
                .filter((x) => {
                    const t = x.created_at ? new Date(x.created_at).getTime() : 0;
                    return t >= cutoff;
                })
                .map((x) => ({
                    id: x.id,
                    circleId: x.circle_id,
                    fromName: x.from_name,
                    fromUserId: x.from_user_id,
                    producerId: x.producer_id,
                    producerName: x.producer_name,
                    producerCategory: x.producer_category,
                    whenLabel: x.when_label,
                    dateISO: x.date_iso || undefined,
                    note: x.note || "",
                    createdAtISO: x.created_at
                        ? new Date(x.created_at).toISOString()
                        : new Date().toISOString(),
                    createdAt: x.created_at
                        ? new Date(x.created_at).getTime()
                        : Date.now(),
                }));

            if (!alive) return;

            setPassaggi(mapped);
            savePassaggi(mapped);
        } catch (err) {
            console.error("Errore caricamento passaggi:", err);
                      if (!alive) return;
            setPassaggi([]);
        }
    })().finally(() => {
        loadingPassaggiRef.current = false;
    });

    return () => {
        alive = false;
    };
}, [user?.id, activeCircleId]);
  const onOpenProducer = (producer: Producer) => {
    setScreen({
      name: "producerDetail",
      producer,
      fromTab: "disponibilita",
    });
  };
    const handleDeleteProducer = async (id: string) => {
        if (!user?.id) {
            alert("Devi effettuare il login");
            return;
        }

        try {
            
            const res = await fetch(`${API_BASE}/producers/${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: {
  ...getBearerHeaders(),
},
            });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    setProducers((prev) => prev.filter((x) => x.id !== id));
    setScreen({ name: "tabs", tab: "disponibilita" });
  } catch (err) {
    console.error("Errore eliminazione produttore:", err);
    alert("Errore nell'eliminazione del produttore");
  }
};

    const handleUpdateProducer = async (updated: Producer) => {
        if (!user?.id) {
            alert("Devi effettuare il login");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/producers/${encodeURIComponent(updated.id)}`, {
                method: "PUT",
                headers: {
  "Content-Type": "application/json",
  ...getBearerHeaders(),
},
      body: JSON.stringify({
  name: updated.name,
  category: updated.category,
  address: updated.address || null,
  city: updated.city || null,
  google_maps_url: updated.google_maps_url || null,
  website_url: updated.website_url || null,
  notes: updated.notes || null,
}),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    setProducers((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );

    setScreen({
      name: "producerDetail",
      producer: updated,
      fromTab: "disponibilita",
    });
  } catch (err) {
    console.error("Errore modifica produttore:", err);
    alert("Errore nel salvataggio delle modifiche");
  }
};
  
  let activeTab: Tab = "home";

  if (screen.name === "tabs") {
    activeTab = screen.tab;
  } else if ("fromTab" in screen && screen.fromTab) {
    activeTab = screen.fromTab;
  }
    const refreshCircles = async () => {
        if (!user?.id) {
            setCircles([]);
            setActiveCircleId(null);
            setCircleMembers([]);
            return;
        }

        const data = await apiGet<{ ok: true; circles: Circle[] }>("/circles/mine");

        const list: Circle[] = Array.isArray(data.circles) ? data.circles : [];

        setCircles(list);

        const nextActiveId =
            activeCircleId && list.some((c) => c.id === activeCircleId)
                ? activeCircleId
                : list.length > 0
                    ? list[0].id
                    : null;

        setActiveCircleId(nextActiveId);

        if (!nextActiveId) {
            setCircleMembers([]);
            return;
        }

        try {
            const membersData = await apiGet<{
                ok: true;
                members: CircleMember[];
            }>(`/circles/${encodeURIComponent(nextActiveId)}/members`);

            const members: CircleMember[] = Array.isArray(membersData.members)
                ? membersData.members
                : [];

            setCircleMembers(members);
        } catch (err) {
            console.error("Errore caricamento membri cerchia:", err);
            setCircleMembers([]);
        }
    };
    useEffect(() => {
        let alive = true;

        if (!user?.id) {
            setCircleMembers([]);
            return;
        }

        if (!activeCircleId) {
            setCircleMembers([]);
            return;
        }

        (async () => {
            try {
                const membersData = await apiGet<{
                    ok: true;
                    members: CircleMember[];
                }>(`/circles/${encodeURIComponent(activeCircleId)}/members`);

                if (!alive) return;

                const members: CircleMember[] = Array.isArray(membersData.members)
                    ? membersData.members
                    : [];

                setCircleMembers(members);
            } catch (err) {
                console.error("Errore caricamento membri cerchia:", err);
                if (!alive) return;
                setCircleMembers([]);
            }
        })();

        return () => {
            alive = false;
        };
    }, [user?.id, activeCircleId]);
const handleDeletePassaggio = async (id: string) => {
    console.log("DELETE CLICK", id);
    if (!window.confirm("Eliminare questo passaggio?")) return;

    try {
        await deletePassaggio(id);

        setPassaggi((prev) => {
            const next = prev.filter((p) => p.id !== id);
            savePassaggi(next);
            return next;
        });
    } catch (err) {
        console.error("Errore eliminazione passaggio:", err);
        alert("Errore nell'eliminazione del passaggio");
    }
};
const handleCreateRichiesta = async ({
  producerId,
  producerName,
  itemsText,
  targetUserIds,
}: {
  producerId: string;
  producerName: string;
  itemsText: string;
  targetUserIds: string[];
}) => {
  if (isCreatingRichiesta) return;
  setIsCreatingRichiesta(true);

    if (!user?.id) {
        setRichiestaError("Devi effettuare il login");
        setIsCreatingRichiesta(false);
        return;
    }

    if (!activeCircleId) {
        setRichiestaError("Seleziona o crea una cerchia");
        setIsCreatingRichiesta(false);
        return;
    }

  try {
    const postBody = {
      circle_id: activeCircleId,
      from_name: user.name || "Anonimo",
      producer_id: producerId,
      producer_name: producerName,
      request_text: itemsText.trim() || "Richiesta",
      target_user_ids: targetUserIds,
    };

    const postRes = await fetch(`${API_BASE}/richieste`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getBearerHeaders(),
      },
      body: JSON.stringify(postBody),
    });

    const postOut = await postRes.json().catch(() => ({}));

    if (!postRes.ok || postOut?.ok === false) {
      throw new Error(postOut?.error || `HTTP ${postRes.status}`);
    }

      try {
          const out = await apiGet<{ ok: true; items: any[] }>(
              `/richieste?circle_id=${encodeURIComponent(activeCircleId)}`
          );

          const items = Array.isArray(out.items) ? out.items : [];
          setRichieste(mapBackendRichieste(items));
      } catch (err) {
          console.error("Errore reload richieste:", err);
      }
  } catch (err: any) {
      setRichiestaError(String(err?.message || err));
  } finally {
      setIsCreatingRichiesta(false);
  }
};
    const handleDeleteRichiesta = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/richieste/${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: {
                    ...getBearerHeaders(),
                },
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || data?.ok === false) {
                throw new Error(data?.error || `HTTP ${res.status}`);
            }

            if (!activeCircleId) {
                throw new Error("Cerchia attiva non trovata");
            }

            try {
                const out = await apiGet<{ ok: true; items: any[] }>(
                    `/richieste?circle_id=${encodeURIComponent(activeCircleId)}`
                );

                const items = Array.isArray(out.items) ? out.items : [];
                setRichieste(mapBackendRichieste(items));
            } catch (err) {
                console.error("Errore reload richieste:", err);
            }
        } catch (err: any) {
            console.error("Errore eliminazione richiesta:", err);
            alert(String(err?.message || err));
        }
    };
const content = (() => {
  switch (screen.name) {
    case "producerDetail": {
      const { producer, fromTab } = screen;

      return (
        <ProducerDetail
          producer={producer}
          onBack={() => setScreen({ name: "tabs", tab: fromTab })}
          onStoAndando={() =>
            setScreen({
              name: "stoAndando",
              producer,
              fromTab: "home",
            })
          }
      onUpdateProducer={handleUpdateProducer}
         onDeleteProducer={handleDeleteProducer}
          isFollowed={followedProducerIds.indexOf(producer.id) >= 0}
          onToggleFollow={(id) => {
            setFollowedProducerIds((prev) => {
              const next =
                prev.indexOf(id) >= 0 ? prev.filter((x) => x !== id) : [id, ...prev];
              return next;
            });
          }}
        />
      );
    } 
    case "producerAdd": {
        const draft = producerDraft;
        const setDraft = setProducerDraft;
        
      const canSave =
  draft.name.trim().length > 0 &&
  draft.category.trim().length > 0 &&
  (
    draft.city.trim().length > 0 ||
    draft.google_maps_url.trim().length > 0
  );

        return (
          <div style={styles.page}>
            <div style={styles.headerRow}>
              <div style={styles.avatar}>🙂</div>
              <button
                type="button"
                onClick={() =>
                  setScreen({ name: "tabs", tab: "disponibilita" })
                }
                style={styles.secondaryButton}
              >
                ← Indietro
              </button>
            </div>

            <h2 style={styles.h2}>Nuovo produttore</h2>
            <p style={{ ...styles.muted, marginTop: 6 }}>
              Compila i campi essenziali. Poi lo ritrovi nei tuoi “Seguiti”.
            </p>
            <p style={{ ...styles.muted, marginTop: 6 }}>
  Il produttore verrà inserito nella provincia attiva:{" "}
  <strong>{user?.selected_province_code || "-"}</strong>
</p>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <div>
                <div style={{ ...styles.muted, marginBottom: 6 }}>Nome *</div>
                <input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder='Es. "Az. agricola Gallo"'
                  style={styles.input}
                />
              </div>

             <div>
  <div style={{ ...styles.muted, marginBottom: 6 }}>
    Categoria *
  </div>
  <select
    value={draft.category}
    onChange={(e) =>
      setDraft((p) => ({ ...p, category: e.target.value }))
    }
    style={styles.input}
  >
    <option value="">Seleziona una categoria</option>
    <option value="carni_salumi">Carni e salumi</option>
    <option value="trasformati">Conserve e trasformati</option>
    <option value="farine_pasta">Farine e pasta</option>
    <option value="formaggi">Formaggi e latticini</option>
    <option value="forno_pasticceria">Forno e pasticceria</option>
    <option value="legumi">Legumi</option>
    <option value="miele">Miele</option>
    <option value="olio">Olio</option>
    <option value="ortofrutta">Ortofrutta</option>
    <option value="pesce">Pesce e pescato</option>
    <option value="rivendita">Rivendita produttori locali</option>
    <option value="uova">Uova</option>
    <option value="vino">Vino</option>
  </select>
</div>
<div>
  <div style={{ ...styles.muted, marginBottom: 6 }}>
    Link Google Maps
  </div>
  <input
    value={draft.google_maps_url}
    onChange={(e) =>
      setDraft((p) => ({ ...p, google_maps_url: e.target.value }))
    }
    placeholder="Incolla qui il link Google Maps"
    style={styles.input}
  />
 <div style={{ ...styles.muted, marginTop: 4 }}>
  Inserisci almeno il Comune oppure un link Google Maps, così il produttore sarà più facile da trovare.
</div>
</div>
             <div>
  <div style={{ ...styles.muted, marginBottom: 6 }}>
    Indirizzo
  </div>
  <input
    value={draft.address}
    onChange={(e) =>
      setDraft((p) => ({ ...p, address: e.target.value }))
    }
    placeholder='Es. Contrada Bosco 12 (facoltativo)'
    style={styles.input}
  />
</div>
<div>
  <div style={{ ...styles.muted, marginBottom: 6 }}>
    Sito web o pagina online
  </div>
  <input
    value={draft.website_url}
    onChange={(e) =>
      setDraft((p) => ({ ...p, website_url: e.target.value }))
    }
    placeholder="es. sito web, Facebook o Instagram"
    style={styles.input}
  />
</div>
             <div>
  <div style={{ ...styles.muted, marginBottom: 6 }}>
    Comune
  </div>
  <input
    value={draft.city}
    onChange={(e) =>
      setDraft((p) => ({ ...p, city: e.target.value }))
    }
    placeholder="es. Lucera (facoltativo)"
    style={styles.input}
  />
</div>

             <div>
  <div style={{ ...styles.muted, marginBottom: 6 }}>
    Note
  </div>
  <textarea
    value={draft.notes}
    onChange={(e) =>
      setDraft((p) => ({ ...p, notes: e.target.value }))
    }
    placeholder="es. vendita il sabato mattina"
    style={{ ...styles.input, height: 90, resize: "vertical" }}
  />
</div>

                    <button
          type="button"
          disabled={!canSave || isSavingProducer}
          style={{
            ...styles.primaryButton,
            ...(!canSave || isSavingProducer
              ? { opacity: 0.5, cursor: "not-allowed" }
              : {}),
          }}
          onClick={async () => {
              if (isSavingProducer) return;

              if (!user?.id || !user?.selected_province_code) {
                  alert("Devi effettuare il login");
                  return;
              }

              const currentUser = user as AuthUser;
              setIsSavingProducer(true);

              try {
                  await apiPost<{ ok: true; id: string }>("/producers", {
                      name: draft.name.trim(),
                      category: draft.category.trim(),
                      province_code: currentUser.selected_province_code,
                      city: draft.city.trim() || null,
                      address: draft.address.trim() || null,
                      google_maps_url: draft.google_maps_url.trim() || null,
                      website_url: draft.website_url.trim() || null,
                      notes: draft.notes.trim() || null,
                      created_by_user_id: currentUser.id,
                  });

                  const updated = await fetchProducers(currentUser.selected_province_code);
                  setProducers(updated);

                  setProducerDraft({
                      name: "",
                      category: "",
                      city: "",
                      address: "",
                      google_maps_url: "",
                      website_url: "",
                      notes: "",
                  });

                  setScreen({ name: "tabs", tab: "disponibilita" });
              } catch (err) {
                  console.error("Errore creazione produttore:", err);
                  alert("Errore nel salvataggio del produttore");
              } finally {
                  setIsSavingProducer(false);
              }
          }}
        >
          {isSavingProducer ? "Salvataggio..." : "Aggiungi produttore"}
        </button>
      </div>
    </div>
  );
}
      case "miaArea": {
        return (
          <div style={styles.page}>
            <div style={styles.topBar}>
              <button
                type="button"
                style={styles.backBtn}
                onClick={() => setScreen({ name: "tabs", tab: "home" })}
              >
                ←
              </button>
              <div style={styles.topTitle}>Nella mia area</div>
              <div style={{ width: 32 }} />
            </div>
           
                <div style={styles.card}>
                    <div style={styles.cardTitle}>Nella mia area</div>
                    <div style={styles.cardSub}>
                        Produttori vicini (per ora: elenco completo). Puoi seguire o smettere di seguire.
                    </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                    {producers.map((p) => {
                        const isFollowed = followedProducerIds.includes(p.id);
                        return (
                            <div key={p.id} style={styles.card}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={styles.cardTitle}>{p.name}</div>
                                        <div style={styles.cardSub}>
                                            {p.category} • {p.address} {p.city}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        style={isFollowed ? styles.secondaryButton : styles.primaryButton}
                                        onClick={() => {
                                            setFollowedProducerIds((prev) =>
                                                prev.includes(p.id)
                                                    ? prev.filter((x) => x !== p.id)
                                                    : [p.id, ...prev]
                                            );
                                        }}
                                    >
                                        {isFollowed ? "Non seguire" : "Segui"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
          </div>
        );
      }

      case "intro": {
        return (
          <Intro
            onStart={() => {
              localStorage.setItem("empagij_hasSeenIntro", "1");
              setScreen({ name: "tabs", tab: "home" });
            }}
          />
        );
      }

    case "cerchiaPassaggi": {
    return (
       <CerchiaPassaggi
    passaggi={passaggi.filter((p) => p.circleId === activeCircleId)}
    onBack={() => setScreen({ name: "tabs", tab: "home" })}
    onAddPassaggio={() =>
        setScreen({ name: "producersFollowed", mode: "stoAndando" })
    }
    onOpenJoinPassaggio={(passaggioId) =>
        setScreen({ name: "joinPassaggio", passaggioId })
    }
    myName={myNameLocal}
    onDeletePassaggio={handleDeletePassaggio}
/>
    );
}

      case "stoAndando": {
        const { producer, fromTab } = screen;

        return (
            <StoAndando
                producer={producer}
                onBack={() => {
                    if (fromTab === "home") {
                        setScreen({ name: "producersFollowed", mode: "stoAndando" });
                    } else {
                        setScreen({ name: "producerDetail", producer, fromTab });
                    }
                }}
                onStoAndando={async (draft) => {
                    if (publishingRef.current) return;
                    publishingRef.current = true;

                    try {
                        if (!user?.id) {
                            alert("Devi effettuare il login");
                            return;
                        }
if (!activeCircleId) {
    alert("Devi prima selezionare o creare una cerchia");
    return;
}
                        const whenLabel =
                            draft.when === "oggi"
                                ? "Oggi"
                                : draft.when === "domani"
                                    ? "Domani"
                                    : "Altra data";

                        const created = await addPassaggio(user.id, {
                            fromName: myNameLocal,
                            circleId: activeCircleId || "",
                            producerId: producer.id,
                            producerName: producer.name,
                            fromUserId: user.id,
                            producerCategory: producer.category,
                            whenLabel,
                            dateISO: draft.dateISO || "",
                            note: (draft.note ?? "").trim(),
                            createdAt: Date.now(),
                            createdAtISO: new Date().toISOString(),
                        });

                        setPassaggi((prev) => {
                            if (prev.some((x) => x.id === created.id)) return prev;
                            return [created, ...prev];
                        });

                        setScreen({ name: "passaggi" });
                    } catch (e: any) {
                        alert(
                            "Errore di rete: backend non raggiungibile.\n\n" +
                            String(e?.message || e)
                        );
                    } finally {
                        publishingRef.current = false;
                    }
                }}
               onUpdateProducer={handleUpdateProducer}
            onDeleteProducer={handleDeleteProducer}
            />
        );
      }
       case "passaggi": {
    return (
        <PassaggiList
    items={passaggi.filter((p) => p.circleId === activeCircleId)}
    onOpenJoinPassaggio={(passaggioId) =>
        setScreen({ name: "joinPassaggio", passaggioId })
    }
    onBack={() => setScreen({ name: "tabs", tab: "home" })}
    onDelete={handleDeletePassaggio}
/>
    );
}

      case "producersFollowed": {
        return (
          <ProducersFollowed
            producers={producers}
                followedProducerIds={followedProducerIds}
                mode={screen.mode}
                onOpenProducer={(producer) =>
                    setScreen({
                        name: "stoAndando",
                        producer,
                        fromTab: "home",
                    })
                }
                onBack={() => setScreen({ name: "tabs", tab: "disponibilita" })}
            onUpdateProducer={(updated) => {
              setProducers((prev) =>
                prev.map((p) => (p.id === updated.id ? updated : p))
              );
            }}
          
          />
        );
      }

               case "piccolaRichiesta": {
        return (
          <PiccolaRichiesta
            producers={producers}
            followedProducerIds={followedProducerIds}
            onBack={() => setScreen({ name: "tabs", tab: screen.fromTab })}
            onCreateRequest={(req: Richiesta) => {
              setScreen({
                name: "cerchia",
                mode: "selectForRequest",
                producerId: req.producerId,
                from: "home",
              });
            }}
          />
        );
      }
      case "joinPassaggio": {
  const passaggio = passaggi.find((p) => p.id === screen.passaggioId);
  if (!passaggio) return null;

  return (
    <JoinPassaggio
      passaggio={passaggio}
      onBack={() => setScreen({ name: "passaggi" })}
      onSend={() => {
        alert("Funzione non ancora disponibile in questa versione");
      }}
    />
  );
}
      case "cerchia":
          return (
              <Friends
                  onBack={() => setScreen({ name: "tabs", tab: "home" })}
                  mode={(screen as any).mode || "manage"}
                  producerId={(screen as any).producerId}
                  producers={producers}
                  onCreateRequest={handleCreateRichiesta}
                  richieste={richieste.filter((r) => r.circleId === activeCircleId)}
                  myName={myName}
                  onRespondRequest={handleRespondRequest}
                  isCreatingRichiesta={isCreatingRichiesta}
                  richiestaError={richiestaError}
                  onDeleteRequest={handleDeleteRichiesta}
                  circleMembers={circleMembers}
                  setCircleMembers={setCircleMembers}
                  myInvites={myInvites}
                  userId={user?.id || ""}
                  setMyInvites={setMyInvites}
                  refreshCircles={refreshCircles}
                  circles={circles}
                  activeCircleId={activeCircleId}
                  onChangeActiveCircle={setActiveCircleId}
                  styles={styles}
                  apiBase={API_BASE}
                  getBearerHeaders={getBearerHeaders}
                  apiGet={apiGet}
              />
          );
      case "producerOnboarding": {
        return (
          <ProducerOnboarding
            onBack={() => setScreen({ name: "tabs", tab: screen.fromTab })}
            onCreate={(draft) => {
                const newProducer: Producer = {
                    id: globalThis.crypto.randomUUID(),
                    name: draft.name.trim(),
                    category: draft.category.trim() || "Altro",
                    province_code: user?.selected_province_code || "",
                    address: draft.address.trim() || null,
                    city: draft.city.trim() || null,
                    google_maps_url: draft.google_maps_url.trim() || null,
                    website_url: draft.website_url.trim() || null,
                    notes: draft.notes.trim() || null,
                };

              setProducers((prev) => [newProducer, ...prev]);
              setScreen({ name: "tabs", tab: "disponibilita" });
            }}
          />
        );
      }

      case "tabs": {
        switch (screen.tab) {
       case "home":
  return (
    <Home
      setScreen={setScreen}
      producers={producers}
      passaggi={passaggi.filter((p) => p.circleId === activeCircleId)}
    />
  );

      case "cerchia":
  return (
    <Friends
  onBack={() => setScreen({ name: "tabs", tab: "home" })}
  mode={(screen as any).mode || "manage"}
  producerId={(screen as any).producerId}
  producers={producers}
  onCreateRequest={handleCreateRichiesta}
  richieste={richieste.filter((r) => r.circleId === activeCircleId)}
  myName={myName}
  onRespondRequest={handleRespondRequest}
          isCreatingRichiesta={isCreatingRichiesta}
          richiestaError={richiestaError}
  onDeleteRequest={handleDeleteRichiesta}
      circleMembers={circleMembers}
      setCircleMembers={setCircleMembers}
      myInvites={myInvites}
      userId={user?.id || ""}
      setMyInvites={setMyInvites}
      refreshCircles={refreshCircles}
      circles={circles}
activeCircleId={activeCircleId}
onChangeActiveCircle={setActiveCircleId}
styles={styles}
apiBase={API_BASE}
getBearerHeaders={getBearerHeaders}
apiGet={apiGet}
    />
  );
          case "disponibilita":
            return (
             <Disponibilita
    producers={producers}
    followedProducerIds={followedProducerIds}
    selectedProvinceCode={user?.selected_province_code || "-"}
    onToggleFollow={onToggleFollow}
    onOpenProducer={(producer) =>
      setScreen({
        name: "producerDetail",
        producer,
        fromTab: "disponibilita",
      })
    }
    onUpdateProducer={(updated) => {
      setProducers((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    }}
    onBack={() => setScreen({ name: "tabs", tab: "home" })}
    onOpenMiaArea={() => setScreen({ name: "miaArea" })}
    onAddProducer={() => setScreen({ name: "producerAdd" })}
 />
            );
            case "impostazioni":
  return (
    <Impostazioni
      myName={myName}
      selectedProvinceCode={user?.selected_province_code || "FG"}
      onChangeProvince={(provinceCode) => {
        setUser((prev) =>
          prev ? { ...prev, selected_province_code: provinceCode } : prev
        );
      }}
      onLogout={() => {
        try {
          localStorage.removeItem(LS_TOKEN);
          localStorage.removeItem(LS_USER);
        } catch {}

        setUser(null);
      }}
    />
  );

                default:
                return <Home setScreen={setScreen} producers={producers} passaggi={passaggi} />;
        }
      }
    }
  })();
       const main = !user ? (
        <div
            style={{
                padding: 16,
                maxWidth: 420,
                margin: "0 auto",
                display: "grid",
                gap: 18,
                width: "100%",
            }}
        >
            <div style={{ ...styles.card, padding: 20 }}>
                <div style={{ ...styles.brand, textAlign: "center", marginBottom: 10 }}>
                    empagij
                </div>

                <p
                    style={{
                        opacity: 0.8,
                        marginTop: 0,
                        marginBottom: 0,
                        textAlign: "left",
                        lineHeight: 1.45,
                    }}
                >
                    Per iniziare, registra un account
                    <br />
                    scegli la provincia per vedere i produttori
                    <br />
                    del tuo territorio, già presenti in empagij.
                    <br />
                    <br />
                    Puoi cambiare quando vuoi la provincia di
                    <br />
                    riferimento.
                </p>
            </div>

            <div style={{ ...styles.card, padding: 20 }}>
                <h2 style={{ margin: 0 }}>Registrazione</h2>
                <RegisterBox onLogged={(u) => setUser(u)} />
            </div>

            <div style={{ ...styles.card, padding: 20 }}>
                <h2 style={{ margin: 0 }}>Hai già un account?</h2>
                <p style={{ opacity: 0.8, marginTop: 8 }}>
                    Accedi con la tua email e vedrai
                    <br />
                    passaggi e richieste dalla tua Cerchia
                </p>
                <LoginBox onLogged={(u) => setUser(u)} />
            </div>
        </div>
    ) : (
        content
    );

  return (
    <div style={styles.app}>
          <div style={styles.screen}>{main}</div>

      {screen.name !== "intro" && (
      <BottomNav
  tab={activeTab}
  setTab={(t) => {
    setLastTab(activeTab);
    setScreen({ name: "tabs", tab: t });
  }}
  onOpenFriends={() =>
    setScreen({
      name: "cerchia",
      mode: "manage",
      from: activeTab,
    })
  }
  pendingCerchiaCount={pendingRicevuteCount}
/>
      )}
    </div>
  );
}

/* -------------------- SCREENS -------------------- */

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ ...styles.page, fontSize: 14, lineHeight: "22px" }}>
      <div style={styles.headerRow}>
        <div style={{ width: 28 }} />
        <div style={styles.brand}>empagij</div>
        <div style={{ width: 28 }} />
      </div>

      <h2 style={styles.h1}>Guida rapida</h2>

      <div style={styles.card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
  
                  empagij ti aiuta a coordinare la spesa dai produttori locali con la tua cerchia.
        </div>

       <div style={{ ...styles.bulletRow, marginTop: 18 }}>
          <div style={styles.bulletIcon}>🚗</div>
          <div>
            <b>Sto andando</b>: Puoi avvisare la tua cerchia di amici quando
                      stai andando a fare la spesa da un produttore, così chi vuole può unirsi alla tua spesa.
                      Un viaggio in meno per gli altri e meno “benzina nell’aria” 😉
          </div>
        </div>

        <div style={{ ...styles.bulletRow, marginTop: 18 }}>
          <div style={styles.bulletIcon}>🧺</div>
          <div>
            <b>Richiesta</b>: Puoi chiedere se qualcuno della tua
            cerchia ha in programma di andare da un produttore e scrivere cosa ti serve (es.
            “2 kg orecchiette”).
          </div>
        </div>

        <div style={{ ...styles.bulletRow, marginTop: 18 }}>
          <div style={styles.bulletIcon}>📍</div>
          <div>
            <b>Produttori del tuo territorio</b>: Puoi controllare se i produttori che hai
            scelto nella tua zona hanno novità o (se sei in viaggio) vedere se stai
            passando vicino a qualcuno di loro.
          </div>
        </div>
      </div>

      <div style={{ height: 26 }} />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          style={{ ...styles.primaryBtn, minWidth: 220 }}
          onClick={onStart}
        >
          Inizia
        </button>
      </div>
    </div>
  );
}





function StoAndando({
  producer,
  onBack,
  onStoAndando,
  onUpdateProducer,
  onDeleteProducer,
}: {
  producer: Producer;
  onBack: () => void;
        onStoAndando: (draft: {
            when: WhenChoice;
            dateISO?: string;
            note?: string;
        }) => Promise<void>;
  onUpdateProducer: (p: Producer) => void;
  onDeleteProducer: (id: string) => void;
}) {
  const [whenChoice, setWhenChoice] = useState<WhenChoice>("oggi");
  const [dateISO, setDateISO] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10); // yyyy-mm-dd
  });
    const [note, setNote] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);

    async function publish() {
        if (isPublishing) return;
        setIsPublishing(true);
        try {
            await Promise.resolve(
                onStoAndando({
                    when: whenChoice,
                    dateISO: whenChoice === "altra" ? dateISO : undefined,
                    note: note.trim() || undefined,
                })
            );
        } catch (e: any) {
            alert(
                "Errore di rete: backend non raggiungibile.\n\n" +
                String(e?.message || e)
            );
        } finally {
            setIsPublishing(false);
        }
    }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={onBack}>
          ← Indietro
        </button>
        <div style={styles.avatar}>🙂</div>
      </div>

      <h2 style={styles.h2}>Sto andando</h2>
      <p style={{ ...styles.muted, marginTop: -6 }}>
        Avvisa la tua cerchia che stai passando da un produttore.
      </p>

      <div style={{ height: 12 }} />

      {/* Produttore */}
      <div style={styles.card}>
        <div style={styles.cardTop}>
         <div style={styles.iconSquare}>
                      {CATEGORY_META[producer.category]?.icon || "📍"}
</div>
          <div style={{ flex: 1 }}>
            <div style={styles.cardTitle}>{producer.name}</div>
            <div style={styles.cardSub}>{producer.category}</div>
            <div style={{ ...styles.cardSub, marginTop: 6 }}>
              {producer.notes}
            </div>
          

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}></div>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      {/* Quando andrai */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Quando andrai?</div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <label style={styles.radioRow}>
            <input
              type="radio"
              checked={whenChoice === "oggi"}
              onChange={() => setWhenChoice("oggi")}
            />
            <span>Oggi</span>
          </label>

          <label style={styles.radioRow}>
            <input
              type="radio"
              checked={whenChoice === "domani"}
              onChange={() => setWhenChoice("domani")}
            />
            <span>Domani</span>
          </label>

          <label style={styles.radioRow}>
            <input
              type="radio"
              checked={whenChoice === "altra"}
              onChange={() => setWhenChoice("altra")}
            />
            <span>Altra data</span>
          </label>

          {whenChoice === "altra" ? (
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              style={styles.input}
            />
          ) : null}
        </div>
      </div>

      <div style={{ height: 14 }} />

      {/* Nota */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          Vuoi aggiungere una nota?{" "}
          <span style={styles.muted}>(facoltativo)</span>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="es. Vado nel pomeriggio, potete ritirare da me verso cena"
          style={styles.textarea}
        />
      </div>

      <div style={{ height: 14 }} />

          <button
              style={{ ...styles.primaryBtn, opacity: isPublishing ? 0.6 : 1 }}
              onClick={publish}
              disabled={isPublishing}
          >
              {isPublishing ? "Pubblico..." : "Pubblica passaggio"}
          </button>

      <div style={{ marginTop: 10, ...styles.muted, fontSize: 13 }}>
        Lo vedranno solo le persone della tua cerchia.
      </div>
    </div>
  );
}

function ProducerDetail({
  producer,
  onBack,
  onStoAndando,
  onUpdateProducer,
  onDeleteProducer,
  onToggleFollow,
  isFollowed,
}: {
  producer: Producer;
  onBack: () => void;
  onStoAndando: () => void;
  onUpdateProducer: (updated: Producer) => void;
  onDeleteProducer?: (id: string) => void;
  onToggleFollow: (id: string) => void;
  isFollowed: boolean;
}) {
  if (!producer) {
    return (
      <div style={styles.page}>
        <div style={styles.headerRow}>
          <button style={styles.backBtn} onClick={onBack}>
            ← Indietro
          </button>
        </div>
        <div style={styles.card}>Errore: produttore non trovato.</div>
      </div>
    );
  }
    const [isEditing, setIsEditing] = useState(false);
    const [editDraft, setEditDraft] = useState<Producer>({
        ...producer,
    });
    useEffect(() => {
        setEditDraft({ ...producer });
        setIsEditing(false);
    }, [producer.id]);
  
  const mapQuery = encodeURIComponent(
    `${producer.address}, ${producer.city}`
  );
  const mapsUrl =
  producer.google_maps_url?.trim() ||
  `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={onBack}>
          ← Indietro
        </button>
        <div style={styles.avatar}>🙂</div>
      </div>

      <div style={styles.detailCard}>
        <div style={styles.detailTitle}>{producer.name}</div>
        <div style={styles.detailMeta}>{producer.category}</div>

        <div style={{ height: 10 }} />
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}></div>

        <div style={styles.detailSectionTitle}>Cosa trovi</div>
        <div style={styles.detailText}>{producer.notes}</div>
        
        <div style={{ height: 14 }} />

        <div style={{ marginTop: 14 }}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Dov&apos;è?</div>
            <div style={styles.cardSub}>
              {producer.address}
              {producer.city ? ` • ${producer.city}` : ""}
            </div>

            <div style={{ height: 10 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                style={styles.secondaryBtn}
                onClick={() => {
                  navigator.clipboard.writeText(mapsUrl);
                  alert(
                    "Link mappa copiato. Incollalo nella barra del browser."
                  );
                }}
              >
                Apri mappa
              </button>

              <div
                style={{
                  fontSize: 12,
                  color: "#6f6b62",
                  wordBreak: "break-all",
                }}
              >
                {mapsUrl}
              </div>

              <div style={{ ...styles.muted, fontSize: 13 }}>
                (apre Google Maps in una nuova scheda)
              </div>
            </div>
          </div>
        </div>
      </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button
                  type="button"
                  style={styles.btnSecondary}
                  onClick={() => setIsEditing((v) => !v)}
              >
                  {isEditing ? "Annulla" : "Modifica"}
              </button>

           <button
    type="button"
    style={styles.btnSecondary}
    onClick={() => {
        if (!window.confirm("Eliminare questo produttore?")) return;
        onDeleteProducer?.(producer.id);
    }}
>
    Elimina
</button>
          </div>
          
          {isEditing && (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div>
                      <div style={{ ...styles.muted, marginBottom: 6 }}>Nome</div>
                      <input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                          style={styles.input}
                      />
                  </div>

                  <div>
                      <div style={{ ...styles.muted, marginBottom: 6 }}>Categoria</div>
                      <input
                          value={editDraft.category}
                          onChange={(e) =>
                              setEditDraft((p) => ({ ...p, category: e.target.value }))
                          }
                          style={styles.input}
                      />
                  </div>

                  <div>
                      <div style={{ ...styles.muted, marginBottom: 6 }}>Indirizzo</div>
                      <input
                          value={editDraft.address || ""}
                          onChange={(e) =>
                              setEditDraft((p) => ({ ...p, address: e.target.value }))
                          }
                          style={styles.input}
                      />
                  </div>

                                   <div>
                      <div style={{ ...styles.muted, marginBottom: 6 }}>Città / Provincia</div>
                      <input
                          value={editDraft.city || ""}
                          onChange={(e) =>
                              setEditDraft((p) => ({ ...p, city: e.target.value }))
                          }
                          style={styles.input}
                      />
                  </div>

                  <div>
                      <div style={{ ...styles.muted, marginBottom: 6 }}>Link Google Maps</div>
                      <input
                          value={editDraft.google_maps_url || ""}
                          onChange={(e) =>
                              setEditDraft((p) => ({ ...p, google_maps_url: e.target.value }))
                          }
                          style={styles.input}
                      />
                  </div>

                  <div>
                      <div style={{ ...styles.muted, marginBottom: 6 }}>Sito web / pagina online</div>
                      <input
                          value={editDraft.website_url || ""}
                          onChange={(e) =>
                              setEditDraft((p) => ({ ...p, website_url: e.target.value }))
                          }
                          style={styles.input}
                      />
                  </div>

                  <div>
                      <div style={{ ...styles.muted, marginBottom: 6 }}>Descrizione</div>
                      <textarea
                          value={editDraft.notes || ""}
                          onChange={(e) =>
                              setEditDraft((p) => ({ ...p, notes: e.target.value }))
                          }
                          style={{ ...styles.textarea, marginTop: 0 }}
                      />
                                          <button
                          type="button"
                          style={styles.primaryBtn}
                          onClick={() => {
                              onUpdateProducer({
                                  ...editDraft,
                                  name: editDraft.name.trim(),
                                  category: editDraft.category.trim(),
                                  address: editDraft.address?.trim() || "",
                                  city: editDraft.city?.trim() || "",
                                  notes: editDraft.notes?.trim() || "",
                                  google_maps_url: editDraft.google_maps_url?.trim() || "",
                                  website_url: editDraft.website_url?.trim() || "",
                              });
                              setIsEditing(false);
                          }}
                      >
                          Salva modifiche
                      </button>
                  </div>
              </div>
          )}
      <div style={{ marginTop: 14 }}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Aggiornamenti</div>
          <div style={styles.cardSub}>
            Qui poi mostreremo gli annunci recenti del produttore.
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- UI PIECES -------------------- */

function PassaggiList({
  items,
  onBack,
  onDelete,
  onOpenJoinPassaggio,
}: {
  items: Passaggio[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onOpenJoinPassaggio: (passaggioId: string) => void;
}) {
  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={onBack}>
          ← Indietro
        </button>
        <div style={styles.avatar}>🙂</div>
      </div>

      <h2 style={styles.h2}>Passaggi</h2>

      {items.length === 0 ? (
        <p style={styles.muted}>Nessun passaggio pubblicato per ora.</p>
      ) : (
        <div style={styles.cardsCol}>
          {items.map((p) => (
            <div key={p.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.iconCircle}>⭕</div>

                <div style={{ flex: 1 }}>
                  <div style={styles.cardTitle}>{p.producerName}</div>
                  <div style={styles.cardSub}>
                    {p.whenLabel}
                    {p.dateISO ? ` • ${formatDateIT(p.dateISO)}` : ""}
                    {p.producerCategory ? ` • ${p.producerCategory}` : ""}
                  </div>

                  {p.note?.trim() ? (
                    <div style={{ marginTop: 8, ...styles.muted }}>
                      {p.note}
                    </div>
                  ) : null}
                 {null} // LEGACY richieste disattivato
                </div>
                <button
  type="button"
  title="Elimina passaggio"
                          onClick={() => {
    onDelete(p.id);
}}
                  style={{
                    border: "2px solid black",
                    background: "white",
                    color: "black",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 8,
                    marginLeft: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 70,
                    zIndex: 9999,
                  }}
                >
                  Elimina LISTA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function CerchiaPassaggi({
    passaggi,
    onBack,
    onAddPassaggio,
    onOpenJoinPassaggio,
    myName,
    onDeletePassaggio,
}: {
    passaggi: Passaggio[];
    onBack: () => void;
    onAddPassaggio: () => void;
    onOpenJoinPassaggio: (passaggioId: string) => void;
    myName: string;
    onDeletePassaggio: (id: string) => void;
}) {
    return (
        <div style={styles.page}>
            <div style={styles.headerRow}>
                <button style={styles.backBtn} onClick={onBack}>
                    ← Indietro
                </button>
                <div style={styles.avatar}>🙂</div>
            </div>

            <h2 style={styles.h2}>Passaggi della cerchia</h2>

            <div style={{ ...styles.muted, marginBottom: 12 }}>
                Qui vedi i passaggi pubblicati nella tua cerchia.
            </div>

            <button
                type="button"
                style={{ ...styles.primaryBtn, marginBottom: 14 }}
                onClick={onAddPassaggio}
            >
                + Pubblica un passaggio
            </button>

            {passaggi.length === 0 ? (
                <div style={styles.card}>
                    <div style={styles.cardTitle}>Nessun passaggio attivo</div>
                    <div style={{ ...styles.muted, marginTop: 6 }}>
                        Quando qualcuno pubblica “Sto andando”, comparirà qui.
                    </div>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {passaggi.map((p) => (
                        <div key={p.id} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div style={styles.iconCircle}>🚗</div>

                                <div style={{ flex: 1 }}>
                                    <div style={styles.cardTitle}>
                                        {p.producerName || "Produttore"}
                                    </div>

                                    <div style={styles.cardSub}>
                                        Da: {p.fromName?.trim() ? p.fromName : myName}
                                    </div>

                                    <div style={styles.cardSub}>
                                        {p.whenLabel}
                                        {p.dateISO ? ` • ${formatDateIT(p.dateISO)}` : ""}
                                        {p.producerCategory ? ` • ${p.producerCategory}` : ""}
                                    </div>

                                    {p.note?.trim() ? (
                                        <div style={styles.cardQuote}>
                                            “{p.note.trim()}”
                                        </div>
                                    ) : null}
                                </div>

                                <button
                                    type="button"
                                    style={styles.btnSecondary}
                                    onClick={() => onDeletePassaggio(p.id)}
                                >
                                    Elimina passaggio
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* -------------------- STYLES -------------------- */

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: "#f6f4ef",
    display: "flex",
    flexDirection: "column",
  },
  screen: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    padding: "18px 26px 0",
  },
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
  muted: { color: "#242827", fontSize: 14, margin: 0, lineHeight: 1.45 },
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
    border: "none",
    cursor: "pointer",
  },

  radioRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#1f1f1f",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #eee6d7",
    background: "#fff",
    fontFamily: "inherit",
  },

  textarea: {
    width: "100%",
    minHeight: 90,
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #eee6d7",
    background: "#fff",
    fontFamily: "inherit",
    resize: "vertical",
  },

  cardsCol: { display: "grid", gap: 12, marginTop: 8 },

  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 28,
    border: "1px solid #eee6d7",
    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
  },
  cardTop: { display: "flex", alignItems: "flex-start", gap: 12 },

  cardTitle: { fontWeight: 800, color: "#1a1a1a", fontSize: 16 },
cardSub: { color: "#3f3a33", fontSize: 14, marginTop: 3 },
  cardQuote: {
    color: "#6f6b62",
    fontSize: 13,
    marginTop: 6,
    fontStyle: "italic",
  },

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
  },
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
},
  dotBadge: {
    color: "#c84a3a",
    fontSize: 18,
    lineHeight: "18px",
    marginTop: 4,
  },

  quoteTitle: { margin: "12px 0 4px", fontWeight: 700, color: "#1f1f1f" },
  quoteText: { margin: "0 0 8px", color: "#6f6b62" },
  inlineHint: { marginTop: 14, display: "inline", fontSize: 14 },
  link: {
    color: "#2f4a3d",
    fontWeight: 700,
    textDecoration: "none",
    margin: "0 6px",
  },

  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    background: "#f6f4ef",
    borderTop: "1px solid #eee6d7",
    padding: "10px 10px 14px",
    display: "flex",
    justifyContent: "center",
    gap: 10,
  },
  navItem: {
    width: 90,
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: 14,
    padding: "8px 10px",
    display: "grid",
    justifyItems: "center",
    gap: 4,
    color: "#6f6b62",
    cursor: "pointer",
  },
  navItemActive: {
    color: "#2f4a3d",
    background: "#fff",
    border: "1px solid #eee6d7",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  back: { color: "#6f6b62", fontSize: 13 },
  backBtn: {
    border: "none",
    background: "transparent",
    color: "#6f6b62",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid #e1d8c9",
    background: "#2f4a3d",
    color: "#fff",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: "18px",
  },

  pill: {
    fontSize: 12,
    color: "#6f6b62",
    background: "#f3efe8",
    border: "1px solid #eee6d7",
    padding: "4px 8px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },
  smallPill: {
    fontSize: 12,
    color: "#c84a3a",
    background: "#fff6f4",
    border: "1px solid #f1d3cd",
    padding: "4px 8px",
    borderRadius: 999,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "#efe9df",
    border: "1px solid #e1d8c9",
    fontSize: 14,
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

  producerBtn: {
    width: "100%",
    border: "1px solid #eee6d7",
    background: "#fff",
    borderRadius: 16,
    padding: 14,
    cursor: "pointer",
    textAlign: "left",
  },
  chev: { color: "#6f6b62", fontSize: 20, marginTop: 4 },

  detailCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    border: "1px solid #eee6d7",
  },
  detailTitle: { fontWeight: 800, fontSize: 16, color: "#1f1f1f" },
  detailMeta: { marginTop: 6, color: "#6f6b62", fontSize: 13 },
  detailSectionTitle: {
    fontWeight: 800,
    color: "#1f1f1f",
    marginBottom: 6,
    fontSize: 13,
  },

  detailText: { color: "#6f6b62", fontSize: 13, lineHeight: 1.4 },
  mapBtnButton: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 999,
    background: "#2f4a3d",
    color: "#fff",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
};
function PiccolaRichiesta({
  producers,
  followedProducerIds,
  onBack,
  onCreateRequest,
}: {
  producers: Producer[];
  followedProducerIds: string[];
  onBack: () => void;
  onCreateRequest: (req: Richiesta) => void;
    }) {
    const myNameLocal = "Anonimo";
    const onSelectProducer = (p: Producer) => {
        const req: Richiesta = {
            id: globalThis.crypto.randomUUID(),
            createdAt: Date.now(),
            circleId: "",
            producerId: p.id,
            producerName: p.name,
            fromUserId: "",
            fromName: myNameLocal,
            itemsText: "",
            toNames: [],
            targetUserIds: [],
            statusByName: {}, // solo legacy/UI
            statusByUserId: {},
            status: "open",
        };

        onCreateRequest(req);
    };
  const visibleProducers = followedProducerIds.length
    ? producers.filter((p) => followedProducerIds.indexOf(p.id) !== -1)
    : producers;

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <button style={styles.backBtn} onClick={onBack}>
          ←
        </button>
        <div style={styles.brand}>empagij</div>
        <div style={styles.avatar}>🙂</div>
      </div>

      <h2 style={styles.h2}>Richiesta alla cerchia</h2>

      <p style={styles.muted}>
        Chiedi alla tua cerchia se qualcuno ha in programma di andare da uno di questi produttori.
      </p>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {visibleProducers.map((p) => (
          <button
            key={p.id}
            type="button"
            style={{
              ...styles.card,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
            onClick={() => onSelectProducer(p)}
          >
            <div style={{ fontWeight: 700 }}>{p.name}</div>
            <div style={styles.cardMeta}>
              {p.category} · {p.address} {p.city ? `· ${p.city}` : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
function ProducersFollowed({
    producers,
    followedProducerIds,
    onOpenProducer,
    onBack,
    onUpdateProducer,
    mode = "browse",
}: {
    producers: Producer[];
    followedProducerIds: string[];
    onOpenProducer: (p: Producer) => void;
    onBack: () => void;
    onUpdateProducer: (p: Producer) => void;
    mode?: "browse" | "stoAndando";
}) {
  const followed = producers.filter(
    (p) => followedProducerIds.indexOf(p.id) !== -1
  );

  return (
    <div style={styles.page}>
          <h2 style={styles.title}>Prima scegli un produttore da seguire</h2>

              <div style={{ height: 12 }} />

          {followed.length === 0 && (
              <div style={styles.muted}>
                  Per pubblicare un passaggio, prima devi seguire almeno un produttore. Scegline uno del tuo territorio e tocca “Segui”.
               
              </div>
          )}

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {(followed.length === 0 ? producers : followed).map((p) => (
                  <div key={p.id} style={styles.card}>
                      <button
                          type="button"
                          onClick={() => onOpenProducer(p)}
                          style={{
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              width: "100%",
                              textAlign: "left",
                              cursor: "pointer",
                          }}
                      >
                          <div style={{ fontWeight: 700 }}>{p.name}</div>
                          <div style={styles.muted}>
                              {p.category}
                              {p.city ? ` • ${p.city}` : ""}

                          </div>
                      </button>

                      <div style={{ height: 10 }} />

                      {mode === "browse" && (
                          <div style={{ display: "flex", gap: 10 }}>
                              <button
                                  type="button"
                                  style={styles.btnSecondary}
                                  onClick={() => {
                                      const name = window.prompt("Nuovo nome produttore:", p.name);
                                      if (!name) return;
                                      onUpdateProducer({ ...p, name: name.trim() });
                                  }}
                              >
                                  Modifica
                              </button>
                          </div>
                      )}
                  </div>
              ))}
          </div>
          <button style={styles.link} onClick={onBack}>
              Scegli un produttore
          </button>
    </div>
  );
}

function ProducerOnboarding({
  onBack,
  onCreate,
}: {
  onBack: () => void;
  onCreate: (draft: ProducerDraft) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
    const [notes, setNotes] = useState("");

  const canSave = name.trim().length > 0 && address.trim().length > 0;

  return (
    <div style={{ padding: 16 }}>
      <h2>Aggiungi un produttore</h2>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <label>
          Nome *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="Es. Azienda Agricola Rossi"
          />
        </label>

        <label>
          Categoria
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.input}
            placeholder="Es. Pasta, Ortaggi, Olio…"
          />
        </label>

        <label>
          Indirizzo *
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={styles.input}
            placeholder="Via, numero civico"
          />
        </label>

        <label>
          Città / Provincia
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={styles.input}
            placeholder="Es. Foggia (FG)"
          />
        </label>

        <label>
          Descrizione
          <textarea
            value={notes}
                      onChange={(e) => setNotes(e.target.value)}
            style={styles.textarea}
            placeholder="Cosa vende, note utili…"
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button type="button" onClick={onBack} style={styles.btnSecondary}>
          Indietro
        </button>

        <button
          type="button"
          disabled={!canSave}
          onClick={() =>
              onCreate({
                  name,
                  category,
                  city,
                  address,
                  google_maps_url: "",
                  website_url: "",
                  notes,
              })
          }
          style={{
            ...styles.btnPrimary,
            opacity: canSave ? 1 : 0.5,
            cursor: canSave ? "pointer" : "not-allowed",
          }}
        >
          Salva
        </button>
      </div>
    </div>
  );
}
function JoinPassaggio({
  passaggio,
  onBack,
  onSend,
}: {
  passaggio: Passaggio;
  onBack: () => void;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <button style={styles.backBtn} onClick={onBack}>
          ←
        </button>
        <div style={styles.brand}>empagij</div>
        <div style={styles.avatar}>🙂</div>
      </div>

      <h2 style={styles.h2}>Mi associo a questo passaggio</h2>
      <p style={styles.muted}>Scrivi cosa ti serve così chi sta andando può aggiungerlo.</p>

      <textarea
        style={{ ...styles.input, height: 90 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Es: 2 kg di orecchiette"
      />

      <button
        style={{ ...styles.primaryBtn, marginTop: 12 }}
        disabled={!text.trim()}
        onClick={() => onSend(text.trim())}
      >
        Invia richiesta
      </button>
    </div>
  );
}
function LoginBox({
    onLogged,
}: {
    onLogged: (u: {
        id: string;
        name: string;
        email: string;
        selected_province_code: string;
    }) => void;
}) {
    const [email, setEmail] = useState("maria@test.it");
    const [password, setPassword] = useState("Prova123!");
    const [error, setError] = useState<string>("");

    return (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
            <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />

            {error ? <div style={{ color: "crimson", fontSize: 13 }}>{error}</div> : null}

            <button
                type="button"
                onClick={async () => {
                    setError("");
                                       try {
                                      const out = await apiPost<{
                                          ok: true;
                                          token: string;
                                          user: {
                                              id: string;
                                              name: string;
                                              email: string;
                                              province_code: string;
                                              province_name?: string;
                                          };
                                      }>(
                                          "/auth/login",
                                          { email, password }
                                      );

                                      localStorage.setItem(LS_TOKEN, out.token);
                                      console.log("TOKEN SALVATO:", out.token);
                                      localStorage.setItem(
                                          "empagij_user",
                                          JSON.stringify({
                                              id: out.user.id,
                                              name: out.user.name,
                                              email: out.user.email,
                                              selected_province_code: out.user.province_code,
                                          })
                                      );

                                      await acceptInviteTokenIfPresent();

                                      onLogged({
                                          id: out.user.id,
                                          name: out.user.name,
                                          email: out.user.email,
                                          selected_province_code: out.user.province_code,
                                      });
                                  } catch (e: any) {
                                      setError(String(e?.message || e));
                                  }
                }}
               style={{
                                      padding: "12px 14px",
                                      borderRadius: 10,
                                      border: "none",
                                      cursor: "pointer",
                                      background: "#6ea96e",
                                      color: "#fff",
                                      fontWeight: 700,
                                  }}
            >
                Entra
            </button>
        </div>
    );
}
function RegisterBox({
    onLogged,
}: {
        onLogged: (u: {
            id: string;
            name: string;
            email: string;
            selected_province_code: string;
        }) => void;
}) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [provinceCode, setProvinceCode] = useState("FG");
    const [provinceName, setProvinceName] = useState("Foggia");
    const [error, setError] = useState<string>("");

    return (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />

            <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />

            <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />

                                           <div>
                <div
                    style={{
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 6,
                    }}
                >
                    Provincia
                </div>

                <select
                    value={provinceCode}
                    onChange={(e) => {
                        const v = e.target.value;
                        setProvinceCode(v);
                        const selectedProvince = PROVINCES.find((p) => p.code === v);
                        setProvinceName(selectedProvince?.name || v);
                    }}
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", width: "100%" }}
                >
                    {PROVINCES.map((province) => (
                        <option key={province.code} value={province.code}>
                            {province.name}
                        </option>
                    ))}
                </select>

                <div
                    style={{
                        fontSize: 12,
                        lineHeight: 1.4,
                        opacity: 0.75,
                        marginTop: 8,
                        textAlign: "right",
                    }}
                >
                    Da ora vedrai i produttori della provincia di <strong>{provinceName}</strong>.
                </div>
            </div>

            {error ? <div style={{ color: "crimson", fontSize: 13 }}>{error}</div> : null}

            <button
                type="button"
                onClick={async () => {
                    setError("");
                                       try {
                                      const out = await apiPost<{
                                          ok: true;
                                          token: string;
                                          user: {
                                              id: string;
                                              name: string;
                                              email: string;
                                              province_code: string;
                                              province_name: string;
                                          };
                                      }>("/auth/register", {
                                          name,
                                          email,
                                          password,
                                          province_code: provinceCode,
                                          province_name: provinceName,
                                      });

                                      localStorage.setItem(LS_TOKEN, out.token);

                                      localStorage.setItem(
                                          LS_USER,
                                          JSON.stringify({
                                              id: out.user.id,
                                              name: out.user.name,
                                              email: out.user.email,
                                              selected_province_code: out.user.province_code,
                                          })
                                      );

                                      await acceptInviteTokenIfPresent();

                                      onLogged({
                                          id: out.user.id,
                                          name: out.user.name,
                                          email: out.user.email,
                                          selected_province_code: out.user.province_code,
                                      });
                                  } catch (e: any) {
                                      setError(String(e?.message || e));
                                  }
                }}
                style={{
                                      padding: "12px 14px",
                                      borderRadius: 10,
                                      border: "none",
                                      cursor: "pointer",
                                      background: "#6ea96e",
                                      color: "#fff",
                                      fontWeight: 700,
                                  }}
            >
                Registrati
            </button>
        </div>
    );
}