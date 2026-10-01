import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import { useSocket } from "../context/SocketContext";
import messageSound from "../assets/sounds/message.mp3";

const preferenceForType = {
  message: "notifyMessages",
  like: "notifyLikes",
  reply: "notifyReplies",
  follow: "notifyFollowers",
};

const readPreferences = () => {
  try {
    return JSON.parse(localStorage.getItem("spools-preferences") || "{}");
  } catch {
    return {};
  }
};

const NotificationManager = () => {
  const { socket } = useSocket();
  const location = useLocation();
  const selectedConversation = useRecoilValue(selectedConversationAtom);

  useEffect(() => {
    const handleNotification = async (notification) => {
      if (document.hidden || !document.hasFocus()) return;
      const preferences = readPreferences();
      const preferenceKey = preferenceForType[notification?.type];
      if (!preferenceKey || preferences.pauseNotifications || preferences[preferenceKey] === false) return;

      const isCurrentMessage = notification.type === "message" &&
        location.pathname === "/chat" &&
        String(selectedConversation?.userId) === String(notification.senderId);
      if (isCurrentMessage) return;

      if (preferences.soundEffects !== false) {
        try {
          const sound = new Audio(messageSound);
          await sound.play();
        } catch {
          // Browsers can block audio until the user interacts with the app.
        }
      }

      if ("Notification" in window && Notification.permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          await registration?.showNotification(notification.title || "Spools", {
            body: notification.body || "You have a new notification.",
            icon: notification.icon || "/pwa-192x192.png",
            badge: "/favicon.png",
            tag: notification.tag || `spools-${notification.type}`,
            silent: true,
            data: { url: notification.url || "/" },
          });
        } catch {
          // Push support is optional while the page is open.
        }
      }
    };

    socket?.on("appNotification", handleNotification);
    return () => socket?.off("appNotification", handleNotification);
  }, [socket, location.pathname, selectedConversation?.userId]);

  return null;
};

export default NotificationManager;
