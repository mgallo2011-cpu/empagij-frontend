import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App";

const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);

const API_BASE = "https://empagij-backend-delsud.onrender.com";
const VAPID_PUBLIC_KEY =
  "BAhvmiLyHCnTuGE7BHbeMuSiI1vnLdQwBJveRzrId3Chaqm35_2th5J1svizT4xI5Tswt1N9dwzqvFfpyUTBlv4";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function registerPush(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) {
      console.log("registerPush: serviceWorker non supportato");
      return;
    }

    if (!("PushManager" in window)) {
      console.log("registerPush: PushManager non supportato");
      return;
    }

    if (!("Notification" in window)) {
      console.log("registerPush: Notification non supportato");
      return;
    }

    const token = localStorage.getItem("empagij_token");
    console.log("registerPush: token presente =", !!token);

    if (!token) {
      console.log("registerPush: token mancante, skip");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("registerPush: service worker registrato");

    let permission = Notification.permission;
    console.log("registerPush: permission iniziale =", permission);

    if (permission !== "granted") {
      permission = await Notification.requestPermission();
      console.log("registerPush: permission dopo request =", permission);
    }

    if (permission !== "granted") {
      console.log("registerPush: permesso non concesso, skip");
      return;
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      console.log("registerPush: nuova subscription creata");
    } else {
      console.log("registerPush: subscription esistente trovata");
    }

    const res = await fetch(`${API_BASE}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscription),
    });

    const data = await res.json().catch(() => ({}));

    console.log("registerPush: /push/subscribe status =", res.status, data);

    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    console.log("registerPush: subscription salvata sul backend");
  } catch (err) {
    console.error("registerPush ERROR:", err);
    throw err;
  }
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);