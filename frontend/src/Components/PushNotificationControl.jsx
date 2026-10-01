import { useEffect, useState } from "react";
import { FiBell, FiBellOff, FiLoader } from "react-icons/fi";

const decodeApplicationServerKey = (encodedKey) => {
  const paddedKey = encodedKey.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(paddedKey.padEnd(Math.ceil(paddedKey.length / 4) * 4, "="));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
};

const getSavedNotificationPreferences = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("spools-preferences") || "{}");
    return Object.fromEntries(
      ["pauseNotifications", "notifyLikes", "notifyReplies", "notifyFollowers", "notifyMessages", "soundEffects"]
        .filter((key) => typeof saved[key] === "boolean")
        .map((key) => [key, saved[key]])
    );
  } catch {
    return {};
  }
};

const PushNotificationControl = () => {
  const [config, setConfig] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const prepare = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setConfig({ unsupported: true });
        return;
      }

      try {
        const response = await fetch("/api/notifications/config");
        const data = await response.json();
        if (cancelled) return;
        setConfig(data);
        if (!data.enabled) return;

        const serviceWorker = await navigator.serviceWorker.ready;
        if (cancelled) return;
        setRegistration(serviceWorker);
        const currentSubscription = await serviceWorker.pushManager.getSubscription();
        if (!cancelled) setSubscription(currentSubscription);
        if (currentSubscription) {
          const syncResponse = await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...currentSubscription.toJSON(),
              preferences: getSavedNotificationPreferences(),
            }),
          });
          if (!syncResponse.ok && !cancelled) setError("Could not sync this device's push subscription.");
        }
      } catch {
        if (!cancelled) setError("Could not connect to the notification service.");
      }
    };

    prepare();
    return () => { cancelled = true; };
  }, []);

  const togglePushNotifications = async () => {
    if (!registration || busy) return;
    setBusy(true);
    setError("");
    try {
      if (subscription) {
        const response = await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not turn off push notifications.");
        await subscription.unsubscribe();
        setSubscription(null);
        return;
      }

      if (Notification.permission === "denied") {
        throw new Error("Notifications are blocked by your browser. Allow them in your device or browser settings first.");
      }

      const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Allow notifications to receive alerts from Spools.");

      const nextSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeApplicationServerKey(config.publicKey),
      });
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nextSubscription.toJSON(),
          preferences: getSavedNotificationPreferences(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        await nextSubscription.unsubscribe();
        throw new Error(data.error || "Could not save this device for push notifications.");
      }
      setSubscription(nextSubscription);
    } catch (toggleError) {
      setError(toggleError.message || "Could not update push notifications.");
    } finally {
      setBusy(false);
    }
  };

  const isSubscribed = Boolean(subscription);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className={`mt-0.5 rounded-xl p-2 ${isSubscribed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}>
          {isSubscribed ? <FiBell size={17} /> : <FiBellOff size={17} />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Push notifications on this device</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {config?.unsupported
              ? "This browser does not support web push notifications."
              : !config?.enabled
                ? "Push delivery needs VAPID keys configured on the server."
                : isSubscribed
                  ? "This device can receive alerts while Spools is closed."
                  : "Get alerts for messages, replies, likes, and new followers."}
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
            On iPhone or iPad, add Spools to the Home Screen and open it there to enable push.
          </p>
          {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-2">{error}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={togglePushNotifications}
        disabled={!config?.enabled || !registration || busy || config?.unsupported}
        className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 min-h-11 text-xs font-semibold disabled:opacity-40 transition-opacity"
      >
        {busy ? <FiLoader className="animate-spin" size={15} /> : null}
        {isSubscribed ? "Turn off on this device" : "Enable on this device"}
      </button>
    </div>
  );
};

export default PushNotificationControl;
