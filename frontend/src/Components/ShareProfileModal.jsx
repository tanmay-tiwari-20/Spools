import { useState } from "react";
import { FiShare2, FiCopy, FiCheck, FiX, FiExternalLink } from "react-icons/fi";
import { FaWhatsapp, FaXTwitter, FaTelegram, FaLinkedin } from "react-icons/fa6";
import useShowToast from "../hooks/useShowToast";

const ShareProfileModal = ({ isOpen, onClose, user }) => {
  const [copied, setCopied] = useState(false);
  const showToast = useShowToast();

  if (!isOpen || !user) return null;

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${user.username}`
    : `https://spools.net/${user.username}`;

  const shareText = `Check out ${user.name} (@${user.username}) on Spools:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      showToast("Link Copied", "Profile link copied to clipboard.", "success");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSystemShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} (@${user.username}) • Spools`,
          text: shareText,
          url: profileUrl,
        });
      } catch (err) {
        // user cancelled share
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5 cursor-default text-zinc-900 dark:text-white"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FiShare2 size={18} className="text-zinc-700 dark:text-zinc-300" />
            <h3 className="font-bold text-base">Share Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Profile Preview Card */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-3.5">
          <img
            src={user.profilePic || "/defaultdp.png"}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              @{user.username}
            </p>
            {user.bio && (
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-1 mt-0.5">
                {user.bio}
              </p>
            )}
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 shrink-0">
            spools.net
          </span>
        </div>

        {/* Direct Social Channels (SVG Icons, no emojis) */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2.5">
            Share directly via
          </p>
          <div className="grid grid-cols-4 gap-2">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `${shareText} ${profileUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all duration-200 active:scale-95"
              title="Share to WhatsApp"
            >
              <FaWhatsapp size={22} />
              <span className="text-[10px] font-semibold mt-1">WhatsApp</span>
            </a>

            {/* X (Twitter) */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                shareText
              )}&url=${encodeURIComponent(profileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900/10 dark:bg-white/10 hover:bg-zinc-900/20 dark:hover:bg-white/20 text-zinc-900 dark:text-white transition-all duration-200 active:scale-95"
              title="Share to X"
            >
              <FaXTwitter size={20} />
              <span className="text-[10px] font-semibold mt-1">X</span>
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                profileUrl
              )}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 transition-all duration-200 active:scale-95"
              title="Share to Telegram"
            >
              <FaTelegram size={22} />
              <span className="text-[10px] font-semibold mt-1">Telegram</span>
            </a>

            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                profileUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 transition-all duration-200 active:scale-95"
              title="Share to LinkedIn"
            >
              <FaLinkedin size={22} />
              <span className="text-[10px] font-semibold mt-1">LinkedIn</span>
            </a>
          </div>
        </div>

        {/* System share button if supported */}
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <button
            type="button"
            onClick={handleSystemShare}
            className="w-full py-2.5 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-zinc-700 dark:text-zinc-300 active:scale-95"
          >
            <FiExternalLink size={14} />
            <span>More Sharing Options (Device Share)</span>
          </button>
        )}

        {/* Copy Link Input Bar */}
        <div className="pt-1">
          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40">
            <input
              type="text"
              readOnly
              value={profileUrl}
              className="bg-transparent text-xs text-zinc-600 dark:text-zinc-300 w-full focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              }`}
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareProfileModal;
