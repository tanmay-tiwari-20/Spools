import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import useLogout from "../hooks/useLogout";
import { useTheme } from "../context/ThemeContext";
import {
  FiArrowLeft,
  FiEdit3,
  FiUser,
  FiLock,
  FiBell,
  FiSliders,
  FiShield,
  FiHelpCircle,
  FiAlertTriangle,
  FiLogOut,
  FiCheck,
  FiCheckCircle,
  FiMonitor,
  FiX,
  FiExternalLink,
  FiMail,
  FiSmartphone,
  FiZap,
  FiBookOpen,
  FiFileText,
  FiShare2,
} from "react-icons/fi";
import { BsMoonStars, BsSun } from "react-icons/bs";
import ShareProfileModal from "../Components/ShareProfileModal";
import PushNotificationControl from "../Components/PushNotificationControl";

export const SettingsPage = ({ isDarkMode: propIsDark, toggleColorMode: propToggle }) => {
  const user = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const logout = useLogout();
  const navigate = useNavigate();

  const themeContext = useTheme();
  const theme = themeContext?.theme || "dark";
  const setTheme = themeContext?.setTheme || (() => {});
  const isDarkMode = propIsDark !== undefined ? propIsDark : themeContext?.isDarkMode;
  const toggleColorMode = propToggle || themeContext?.toggleColorMode;

  // Local interactive preferences stored in localStorage
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem("spools-preferences");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      isPrivate: false,
      replyPermission: "everyone", // 'everyone' | 'following' | 'mentioned'
      sensitiveContentShield: false,
      searchEngineIndexing: true,
      pauseNotifications: false,
      notifyLikes: true,
      notifyReplies: true,
      notifyFollowers: true,
      notifyMessages: true,
      highQualityUploads: true,
      dataSaver: false,
      soundEffects: true,
    };
  });

  const [freezing, setFreezing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeModalContent, setActiveModalContent] = useState(null); // 'terms' | 'privacy' | 'guidelines'

  // Persist preferences
  const updatePreference = (key, value) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("spools-preferences", JSON.stringify(updated));
      return updated;
    });
    if (["pauseNotifications", "notifyLikes", "notifyReplies", "notifyFollowers", "notifyMessages", "soundEffects"].includes(key)) {
      fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      }).then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          showToast("Sync failed", data.error || "This preference was only saved on this device.", "error");
        }
      }).catch(() => {
        showToast("Sync failed", "This preference was only saved on this device.", "error");
      });
    }
    showToast("Preferences Updated", "Your settings have been saved", "success");
  };

  const handleFreezeAccount = async () => {
    if (freezing) return;
    setFreezing(true);
    try {
      const res = await fetch("/api/users/freeze", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }
      if (data.success) {
        setShowFreezeModal(false);
        await logout();
        showToast("Account Frozen", "Your account has been frozen. Log in anytime to reactivate.", "success");
      }
    } catch (error) {
      showToast("Error", error.message || "Failed to freeze account", "error");
    } finally {
      setFreezing(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      setShowLogoutModal(false);
      await logout();
    } catch (error) {
      showToast("Error", error.message || "Logout failed", "error");
      setLoggingOut(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-2xl mx-auto py-3 sm:py-4 px-2 min-[400px]:px-3 sm:px-4 pb-32">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-5 sm:mb-6 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-95 cursor-pointer"
          title="Go back"
        >
          <FiArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Manage your account preferences, theme, and privacy
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* User Profile Card */}
        {user && (
          <div className="bg-white dark:bg-zinc-900/80 rounded-2xl sm:rounded-3xl p-4 min-[400px]:p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={user.profilePic || "/defaultdp.png"}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    <h2 className="break-words font-bold text-lg text-zinc-900 dark:text-white leading-snug">
                      {user.name}
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">@{user.username}</p>
                  <p className="break-all text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-start gap-1">
                    <FiMail className="mt-0.5 shrink-0" size={12} /> {user.email}
                  </p>
                </div>
              </div>

              <div className="flex w-full sm:w-auto items-center gap-2">
                <RouterLink
                  to="/update"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all duration-200 active:scale-95"
                >
                  <FiEdit3 size={14} />
                  <span>Edit Profile</span>
                </RouterLink>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 active:scale-95 cursor-pointer"
                  title="Share Profile"
                >
                  <FiShare2 size={14} />
                  <span>Share</span>
                </button>

                <RouterLink
                  to={`/${user.username}`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 active:scale-95"
                >
                  <FiUser size={14} />
                  <span>View</span>
                </RouterLink>
              </div>
            </div>
          </div>
        )}

        {/* 1. APPEARANCE & THEME (Primary requested feature!) */}
        <section className="bg-white dark:bg-zinc-900/80 rounded-2xl sm:rounded-3xl p-4 min-[400px]:p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                {isDarkMode ? <BsMoonStars size={18} /> : <BsSun size={18} />}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-base text-zinc-900 dark:text-white">
                  Appearance & Theme
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select your interface theme or sync with your system preference
                </p>
              </div>
            </div>
          </div>

          {/* 3 Theme Cards: Dark, Light, System */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                theme === "dark"
                  ? "border-zinc-900 dark:border-white bg-zinc-100/80 dark:bg-zinc-800/90 shadow-md ring-1 ring-zinc-900 dark:ring-white"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/40"
              }`}
            >
              {theme === "dark" && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center">
                  <FiCheck size={12} strokeWidth={3} />
                </div>
              )}
              {/* Card visual mockup */}
              <div className="w-full h-14 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex flex-col justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
                  <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900 dark:text-white">
                  <BsMoonStars size={14} />
                  <span>Dark Mode</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  OLED Pitch Black (Spools signature)
                </p>
              </div>
            </button>

            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                theme === "light"
                  ? "border-zinc-900 dark:border-white bg-zinc-100/80 dark:bg-zinc-800/90 shadow-md ring-1 ring-zinc-900 dark:ring-white"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/40"
              }`}
            >
              {theme === "light" && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center">
                  <FiCheck size={12} strokeWidth={3} />
                </div>
              )}
              {/* Card visual mockup */}
              <div className="w-full h-14 rounded-xl bg-white border border-zinc-300 p-2 flex flex-col justify-between mb-3 shadow-inner">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                  <div className="w-12 h-1.5 rounded-full bg-zinc-300" />
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900 dark:text-white">
                  <BsSun size={14} />
                  <span>Light Mode</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Crisp daylight presentation
                </p>
              </div>
            </button>

            {/* System Mode Card */}
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                theme === "system"
                  ? "border-zinc-900 dark:border-white bg-zinc-100/80 dark:bg-zinc-800/90 shadow-md ring-1 ring-zinc-900 dark:ring-white"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/40"
              }`}
            >
              {theme === "system" && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center">
                  <FiCheck size={12} strokeWidth={3} />
                </div>
              )}
              {/* Card visual mockup split */}
              <div className="w-full h-14 rounded-xl border border-zinc-400/40 overflow-hidden flex mb-3">
                <div className="w-1/2 h-full bg-white p-2 flex flex-col justify-between">
                  <div className="w-2 h-2 rounded-full bg-zinc-900" />
                  <div className="w-full h-1.5 bg-zinc-200 rounded" />
                </div>
                <div className="w-1/2 h-full bg-zinc-950 p-2 flex flex-col justify-between">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <div className="w-full h-1.5 bg-zinc-800 rounded" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900 dark:text-white">
                  <FiMonitor size={14} />
                  <span>System Default</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Synchronizes with OS theme
                </p>
              </div>
            </button>
          </div>

          {/* Quick Toggle Easter-Egg Banner */}
          <div className="p-3 sm:p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 shrink-0">
                <FiZap size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                  Quick Spools Logo Toggle
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  You can also click the Spools logo in the top bar anytime to instantly flip themes!
                </p>
              </div>
            </div>
            <button
              onClick={toggleColorMode}
              className="w-full sm:w-auto shrink-0 px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-full border border-transparent bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm transition-colors cursor-pointer"
            >
              Toggle Now
            </button>
          </div>
        </section>

        {/* 2. PRIVACY & SAFETY */}
        <section className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <FiLock size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900 dark:text-white">
                Privacy & Safety
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Control who sees your spools and how you interact
              </p>
            </div>
          </div>

          <div className="settings-toggle-list space-y-4 pt-1 divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {/* Private Profile Toggle */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Private Profile
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
                  When enabled, only people you approve can see your spools, replies, and followers.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.isPrivate}
                aria-label="Private profile"
                onClick={() => updatePreference("isPrivate", !preferences.isPrivate)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.isPrivate ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.isPrivate ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Who Can Reply */}
            <div className="pt-4 space-y-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Who Can Reply to Your Spools
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "everyone", label: "Everyone" },
                  { id: "following", label: "Profiles You Follow" },
                  { id: "mentioned", label: "Mentioned Only" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updatePreference("replyPermission", option.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                      preferences.replyPermission === option.id
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sensitive Content Shield */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Sensitive Content Shield
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Automatically blur potentially sensitive media before viewing.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.sensitiveContentShield}
                aria-label="Sensitive content shield"
                onClick={() =>
                  updatePreference("sensitiveContentShield", !preferences.sensitiveContentShield)
                }
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.sensitiveContentShield
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.sensitiveContentShield ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Search Engine Indexing */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Search Engine Indexing
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Allow search engines like Google to index your public profile and spools.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.searchEngineIndexing}
                aria-label="Search engine indexing"
                onClick={() =>
                  updatePreference("searchEngineIndexing", !preferences.searchEngineIndexing)
                }
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.searchEngineIndexing
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.searchEngineIndexing ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 3. NOTIFICATION PREFERENCES */}
        <section className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <FiBell size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900 dark:text-white">
                Notifications
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manage your push and in-app activity notifications
              </p>
            </div>
          </div>

          <PushNotificationControl />

          <div className="settings-toggle-list space-y-4 pt-1 divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {/* Pause All */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Pause All Notifications
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Temporarily silence notifications across all activities.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.pauseNotifications}
                aria-label="Pause all notifications"
                onClick={() =>
                  updatePreference("pauseNotifications", !preferences.pauseNotifications)
                }
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.pauseNotifications
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.pauseNotifications ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Likes */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Likes & Reactions
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Notify when someone likes your spool or comment.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.notifyLikes}
                aria-label="Likes and reactions notifications"
                disabled={preferences.pauseNotifications}
                onClick={() => updatePreference("notifyLikes", !preferences.notifyLikes)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.pauseNotifications
                    ? "opacity-40 cursor-not-allowed bg-zinc-300 dark:bg-zinc-700"
                    : preferences.notifyLikes
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.notifyLikes ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Replies */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Replies & Mentions
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Notify when someone replies to your spool or mentions @{user?.username}.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.notifyReplies}
                aria-label="Replies and mentions notifications"
                disabled={preferences.pauseNotifications}
                onClick={() => updatePreference("notifyReplies", !preferences.notifyReplies)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.pauseNotifications
                    ? "opacity-40 cursor-not-allowed bg-zinc-300 dark:bg-zinc-700"
                    : preferences.notifyReplies
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.notifyReplies ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Followers */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  New Followers
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Notify when a new user starts following you.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.notifyFollowers}
                aria-label="New follower notifications"
                disabled={preferences.pauseNotifications}
                onClick={() =>
                  updatePreference("notifyFollowers", !preferences.notifyFollowers)
                }
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.pauseNotifications
                    ? "opacity-40 cursor-not-allowed bg-zinc-300 dark:bg-zinc-700"
                    : preferences.notifyFollowers
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.notifyFollowers ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Direct Messages */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Direct Messages
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Notify when you receive private chat messages.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.notifyMessages}
                aria-label="Direct message notifications"
                disabled={preferences.pauseNotifications}
                onClick={() => updatePreference("notifyMessages", !preferences.notifyMessages)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.pauseNotifications
                    ? "opacity-40 cursor-not-allowed bg-zinc-300 dark:bg-zinc-700"
                    : preferences.notifyMessages
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.notifyMessages ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 4. MEDIA & ACCESSIBILITY */}
        <section className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <FiSliders size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900 dark:text-white">
                Media & Bandwidth
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Optimize image uploads and network data usage
              </p>
            </div>
          </div>

          <div className="settings-toggle-list space-y-4 pt-1 divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {/* High Quality Uploads */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  High Quality Media Uploads
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Always upload spools photos and attachments at maximum resolution.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.highQualityUploads}
                aria-label="High quality media uploads"
                onClick={() =>
                  updatePreference("highQualityUploads", !preferences.highQualityUploads)
                }
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.highQualityUploads
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.highQualityUploads ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Data Saver */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Data Saver Mode
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Reduce image resolutions and prevent auto-loading large assets on cellular data.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.dataSaver}
                aria-label="Data saver mode"
                onClick={() => updatePreference("dataSaver", !preferences.dataSaver)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.dataSaver
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.dataSaver ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  In-App Sound Effects
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Play in-app alert sounds. Device sounds for system notifications follow your device settings.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.soundEffects}
                aria-label="In-app sound effects"
                onClick={() => updatePreference("soundEffects", !preferences.soundEffects)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  preferences.soundEffects
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white dark:bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    preferences.soundEffects ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 5. ACCOUNT SECURITY & SESSIONS */}
        <section className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <FiShield size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900 dark:text-white">
                Account & Security
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Credentials and authenticated devices
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <FiMail className="text-zinc-500" size={16} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                    Primary Email
                  </p>
                  <p className="text-xs text-zinc-500">{user?.email}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <FiCheckCircle size={13} /> Verified
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <FiSmartphone className="text-zinc-500" size={16} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                    Current Device
                  </p>
                  <p className="text-xs text-zinc-500">Web Client • Active now</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> This Session
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <RouterLink
                to="/update"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
              >
                <span>Change Password or Details in Edit Profile</span>
                <FiExternalLink size={12} />
              </RouterLink>
            </div>
          </div>
        </section>

        {/* 6. ABOUT & LEGAL */}
        <section className="bg-white dark:bg-zinc-900/80 rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
              <FiHelpCircle size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900 dark:text-white">
                About Spools
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Application release, policies, and community terms
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={() => setActiveModalContent("guidelines")}
              className="p-3 text-left rounded-2xl border border-zinc-200/70 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1 text-zinc-900 dark:text-white">
                <FiBookOpen size={15} className="text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white" />
                <p className="text-xs font-semibold">
                  Guidelines
                </p>
              </div>
              <p className="text-[11px] text-zinc-400">Rules & respect</p>
            </button>

            <button
              onClick={() => setActiveModalContent("privacy")}
              className="p-3 text-left rounded-2xl border border-zinc-200/70 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1 text-zinc-900 dark:text-white">
                <FiShield size={15} className="text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white" />
                <p className="text-xs font-semibold">
                  Privacy Policy
                </p>
              </div>
              <p className="text-[11px] text-zinc-400">How data is treated</p>
            </button>

            <button
              onClick={() => setActiveModalContent("terms")}
              className="p-3 text-left rounded-2xl border border-zinc-200/70 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1 text-zinc-900 dark:text-white">
                <FiFileText size={15} className="text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white" />
                <p className="text-xs font-semibold">
                  Terms of Service
                </p>
              </div>
              <p className="text-[11px] text-zinc-400">User agreement</p>
            </button>
          </div>

          <div className="pt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Spools Web v2.4.0 • Built with MERN Stack • Open Conversations
          </div>
        </section>

        {/* 7. DANGER ZONE */}
        <section className="bg-red-50/40 dark:bg-red-950/20 rounded-3xl p-5 sm:p-6 border border-red-200/80 dark:border-red-900/50 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
              <FiAlertTriangle size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-red-950 dark:text-red-200">
                Danger Zone
              </h2>
              <p className="text-xs text-red-600/80 dark:text-red-400/80">
                Temporary account deactivation and session termination
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Freeze Account Card */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-red-100 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Freeze Account
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                    Reversible
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mt-1">
                  Temporarily hide your profile, spools, and likes. You can reactivate anytime simply by logging back in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFreezeModal(true)}
                className="shrink-0 px-4 py-2 text-xs font-semibold rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-400 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/80 transition-all cursor-pointer"
              >
                Freeze Account
              </button>
            </div>

            {/* Log Out Card */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-red-100 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Log Out
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                  End your current session on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-zinc-200 text-zinc-800 hover:bg-red-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-red-600 dark:hover:text-white transition-all cursor-pointer"
              >
                <FiLogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* CONFIRMATION MODAL: FREEZE ACCOUNT */}
      {showFreezeModal && (
        <div
          onClick={() => !freezing && setShowFreezeModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-2">
              <FiAlertTriangle size={24} />
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white text-center">
              Freeze your Spools account?
            </h3>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center leading-relaxed">
              Your profile, posts, comments, and follower list will be hidden from everyone on Spools. You can unfreeze and restore your profile instantly at any time by logging back into your account.
            </p>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                disabled={freezing}
                onClick={() => setShowFreezeModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={freezing}
                onClick={handleFreezeAccount}
                className="flex-1 py-2.5 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {freezing ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Yes, Freeze Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: LOG OUT */}
      {showLogoutModal && (
        <div
          onClick={() => !loggingOut && setShowLogoutModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto mb-2">
              <FiLogOut size={22} />
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white text-center">
              Log out of Spools?
            </h3>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center leading-relaxed">
              You will need to enter your credentials to log back in as @{user?.username}.
            </p>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogoutConfirm}
                className="flex-1 py-2.5 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md transition-colors cursor-pointer"
              >
                {loggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LEGAL & GUIDELINES PREVIEW */}
      {activeModalContent && (
        <div
          onClick={() => setActiveModalContent(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 max-h-[calc(100dvh-2rem)] flex flex-col cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white capitalize">
                {activeModalContent === "guidelines" && "Community Guidelines"}
                {activeModalContent === "privacy" && "Privacy Policy"}
                {activeModalContent === "terms" && "Terms of Service"}
              </h3>
              <button
                onClick={() => setActiveModalContent(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="overflow-y-auto text-xs text-zinc-600 dark:text-zinc-400 space-y-3 pr-2">
              {activeModalContent === "guidelines" && (
                <>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                    1. Be respectful and constructive
                  </p>
                  <p>
                    Spools is built for open, positive, and insightful conversations. We do not tolerate hate speech, harassment, impersonation, or threats against individuals or groups.
                  </p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                    2. Authentic content only
                  </p>
                  <p>
                    Do not spam, engage in artificial follower loops, or distribute malicious software. Share genuine ideas and connect with authentic creators.
                  </p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                    3. Safety first
                  </p>
                  <p>
                    Protect personal private data. Never share someone else&apos;s confidential phone numbers, physical addresses, or credentials without consent.
                  </p>
                </>
              )}

              {activeModalContent === "privacy" && (
                <>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                    1. Information We Collect
                  </p>
                  <p>
                    Spools collects account info (username, email, bio, avatar) and interactions (posts, likes, replies, messages) to provide and enhance your social experience.
                  </p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                    2. How We Protect Your Data
                  </p>
                  <p>
                    Passwords are encrypted with bcrypt salts, session tokens are transmitted over secure HTTP cookies, and media assets are securely hosted on Cloudinary CDN.
                  </p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                    3. Your Choices
                  </p>
                  <p>
                    You have total control over your profile visibility, notification preferences, and account state, including freezing your account at any time.
                  </p>
                </>
              )}

              {activeModalContent === "terms" && (
                <>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                    1. Acceptance of Terms
                  </p>
                  <p>
                    By creating an account or accessing Spools, you agree to comply with our community terms and acceptable use guidelines.
                  </p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                    2. Content Ownership
                  </p>
                  <p>
                    You retain ownership of any text, photos, and replies you publish on Spools. You grant Spools a license to display and distribute your public posts across the network.
                  </p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                    3. Termination & Deactivation
                  </p>
                  <p>
                    You may freeze your account at any moment through these settings, which removes your profile and public posts from active circulation until your next sign in.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveModalContent(null)}
                className="w-full py-2.5 text-xs font-semibold rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE PROFILE MODAL */}
      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
      />
    </div>
  );
};

export default SettingsPage;
