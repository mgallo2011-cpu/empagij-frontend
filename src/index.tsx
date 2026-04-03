import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App";

const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);

async function registerPush() {
  try {
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    const registration = await navigator.serviceWorker.register("/sw.js");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const existingSub = await registration.pushManager.getSubscription();

    let subscription = existingSub;

    if (!subscription) {
      const vapidPublicKey = "BAhvmiLyHCnTuGE7BHbeMuSiI1vnLdQwBJveRzrId3Chaqm35_2th5J1svizT4xI5Tswt1N9dwzqvFfpyUTBlv4";

      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

   const token = localStorage.getItem("empagij_token");
console.log("SW registration OK");
console.log("Notification permission before request:", Notification.permission);
console.log("Token presente:", !!token);

if (subscription && token) {
  await fetch("https://empagij-backend-delsud.onrender.com/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscription),
  });

  console.log("Push subscription inviata al backend");
}
  } catch (err) {
    console.error("Push registration error:", err);
  }
}

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

registerPush();

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);