import { useEffect, useRef, useState } from "react";
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { useTheme } from "../context/ThemeContext";

const GOOGLE_SCRIPT_ID = "google-identity-services";

const GoogleAuthButton = () => {
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const setUser = useSetRecoilState(userAtom);
  const showToast = useShowToast();
  const { isDarkMode } = useTheme();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      buttonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setLoading(true);
          try {
            const response = await fetch("/api/users/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            const data = await response.json();
            if (!response.ok || data.error) {
              showToast("Sign-in failed", data.error || "Google sign-in failed.", "error");
              return;
            }
            localStorage.setItem("user-spools", JSON.stringify(data));
            setUser(data);
            showToast("Welcome", "You’re signed in with Google.", "success");
          } catch (error) {
            showToast("Sign-in failed", error.message || "Google sign-in failed.", "error");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: isDarkMode ? "filled_black" : "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: Math.min(Math.max(buttonRef.current.clientWidth, 240), 400),
        logo_alignment: "center",
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return undefined;
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID);
    const onLoad = () => renderGoogleButton();
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", onLoad);
    if (window.google?.accounts?.id) onLoad();
    return () => script?.removeEventListener("load", onLoad);
  }, [clientId, isDarkMode, setUser, showToast]);

  if (clientId) {
    return (
      <div className="relative mt-4 flex min-h-11 w-full justify-center">
        <div ref={buttonRef} className="min-h-11 w-full [&>div]:mx-auto" />
        {loading && <div className="absolute inset-0 grid place-items-center rounded-full bg-white/75 text-xs font-semibold text-zinc-700 backdrop-blur-sm dark:bg-zinc-900/75 dark:text-zinc-200">Signing in…</div>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => showToast("Google sign-in unavailable", "Add the Google OAuth client ID to enable this option.", "error")}
      className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <span className="font-bold text-base text-[#4285F4]" aria-hidden="true">G</span>
      Continue with Google
    </button>
  );
};

export default GoogleAuthButton;
