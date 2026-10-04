import { useEffect, useRef, useState } from "react";
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { useTheme } from "../context/ThemeContext";

const GOOGLE_SCRIPT_ID = "google-identity-services";

const GoogleMark = () => (
  <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.75 3.28-8.09Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.15A11 11 0 0 0 1 12c0 1.78.43 3.47 1.15 4.94l3.69-2.84Z" />
    <path fill="#EA4335" d="M12 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.85 6.06l3.69 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
  </svg>
);

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
      <div className="group relative mt-4 min-h-11 w-full cursor-pointer overflow-hidden rounded-full">
        <div
          ref={buttonRef}
          className="absolute inset-0 z-10 h-11 w-full opacity-0 [&>div]:mx-auto [&>div]:w-full"
        />
        <div aria-hidden="true" className="pointer-events-none flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#3c4043] transition-colors duration-150 group-hover:bg-[#f8f9fa] dark:border-zinc-700 dark:bg-[#131314] dark:text-zinc-100 dark:group-hover:bg-[#1c1c1e]">
          <GoogleMark />
          <span>Continue with Google</span>
        </div>
        {loading && <div className="absolute inset-0 z-20 grid place-items-center rounded-full bg-white/85 text-xs font-semibold text-zinc-700 dark:bg-zinc-900/85 dark:text-zinc-200">Signing in…</div>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => showToast("Google sign-in unavailable", "Add the Google OAuth client ID to enable this option.", "error")}
      className="mt-4 flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      <GoogleMark />
      Continue with Google
    </button>
  );
};

export default GoogleAuthButton;
