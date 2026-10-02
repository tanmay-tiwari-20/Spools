import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRecoilValue } from "recoil";
import { BsCheck2All } from "react-icons/bs";
import { FiCornerUpLeft, FiCopy, FiDownload, FiMoreHorizontal, FiTrash2, FiX } from "react-icons/fi";
import { format } from "date-fns";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

const Message = ({ ownMessage, message, onReply, onDelete, onImageLoad }) => {
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 12, left: 12 });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStart = useRef(null);
  const longPressTimer = useRef(null);
  const menuRef = useRef(null);

  const formattedTime = message.createdAt ? format(new Date(message.createdAt), "h:mm a") : "";

  const openActionsAt = (x, y) => {
    const menuHeight = ownMessage ? 142 : 104;
    const menuWidth = 176;
    setMenuPosition({
      top: Math.max(12, Math.min(y - 44, window.innerHeight - menuHeight - 12)),
      left: Math.max(12, Math.min(x - menuWidth / 2, window.innerWidth - menuWidth - 12)),
    });
    setActionsOpen(true);
  };

  useEffect(() => {
    if (!actionsOpen && !imageOpen) return undefined;
    const handlePointerDown = (event) => {
      if (actionsOpen && !menuRef.current?.contains(event.target)) setActionsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActionsOpen(false);
        setImageOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionsOpen, imageOpen]);

  useEffect(() => () => clearTimeout(longPressTimer.current), []);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    touchStart.current = { x: startX, y: startY, moved: false };
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => openActionsAt(startX, startY), 500);
  };

  const handleTouchMove = (event) => {
    if (!touchStart.current) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      touchStart.current.moved = true;
      clearTimeout(longPressTimer.current);
    }
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
      setSwipeOffset(Math.min(deltaX, 64));
    }
  };

  const handleTouchEnd = (event) => {
    clearTimeout(longPressTimer.current);
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    if (deltaX > 68 && Math.abs(deltaY) < 48) onReply?.(message);
    touchStart.current = null;
    setSwipeOffset(0);
  };

  const copyMessage = async () => {
    const value = message.text || message.img;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showToast("Copied", message.text ? "Message copied to clipboard." : "Image link copied to clipboard.", "success");
    } catch {
      showToast("Could not copy", "Clipboard access is unavailable in this browser.", "error");
    }
    setActionsOpen(false);
  };

  const deleteMessage = async () => {
    try {
      const response = await fetch(`/api/messages/${message._id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.error || "Could not delete this message.");
      onDelete?.(message, data);
      showToast("Message deleted", "This message was removed from the conversation.", "success");
    } catch (error) {
      showToast("Could not delete message", error.message, "error");
    }
    setActionsOpen(false);
  };

  const downloadUrl = message.img?.includes("res.cloudinary.com")
    ? message.img.replace("/upload/", "/upload/fl_attachment/")
    : message.img;
  const quotedAuthor = String(message.replyTo?.sender) === String(currentUser?._id)
    ? "You"
    : `@${selectedConversation.username}`;

  return (
    <div
      onContextMenu={(event) => {
        event.preventDefault();
        openActionsAt(event.clientX, event.clientY);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        clearTimeout(longPressTimer.current);
        touchStart.current = null;
        setSwipeOffset(0);
      }}
      className={`group relative mb-3 flex max-w-[90%] touch-pan-y items-end gap-2 sm:max-w-[78%] ${ownMessage ? "ml-auto flex-row-reverse" : "mr-auto"}`}
      style={{ transform: `translateX(${swipeOffset}px)` }}
    >
      {swipeOffset > 20 && <FiCornerUpLeft aria-hidden="true" className="absolute left-0 top-1/2 -translate-x-8 -translate-y-1/2 text-indigo-500" size={18} />}

      {!ownMessage && (
        <img
          src={selectedConversation.userProfilePic || "/defaultdp.png"}
          className="mb-1 h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          alt=""
        />
      )}

      <div className={`relative flex min-w-0 flex-col ${ownMessage ? "items-end" : "items-start"}`}>
        {(message.replyTo || message.text) && (
          <div className={`max-w-full overflow-hidden ${ownMessage ? "rounded-2xl rounded-br-sm bg-zinc-900 text-white shadow-sm dark:bg-indigo-600" : "rounded-2xl rounded-bl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"}`}>
            {message.replyTo && (
              <div className={`mx-2 mt-2 flex max-w-[min(320px,70vw)] gap-2 rounded-xl border-l-[3px] px-3 py-2 ${ownMessage ? "border-white/70 bg-white/10" : "border-indigo-500 bg-white/80 dark:bg-zinc-900/55"}`}>
                <FiCornerUpLeft aria-hidden="true" className={`mt-0.5 shrink-0 ${ownMessage ? "text-white/70" : "text-indigo-600 dark:text-indigo-300"}`} size={13} />
                <div className="min-w-0">
                  <p className={`truncate text-[10px] font-bold tracking-wide ${ownMessage ? "text-white/80" : "text-indigo-700 dark:text-indigo-300"}`}>{quotedAuthor}</p>
                  <p className={`max-h-8 overflow-hidden break-words text-xs leading-4 ${ownMessage ? "text-white/80" : "text-zinc-600 dark:text-zinc-300"}`}>{message.replyTo.text || (message.replyTo.img ? "Photo" : "Message")}</p>
                </div>
              </div>
            )}
            {message.text && <p className="whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed">{message.text}</p>}
          </div>
        )}

        {message.img && (
          <button type="button" onClick={() => setImageOpen(true)} aria-label="Open shared image" className="relative mt-1 block max-w-full cursor-zoom-in overflow-hidden rounded-xl text-left">
            {!imgLoaded && <span className="block aspect-[4/3] w-[min(280px,68vw)] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />}
            <img src={message.img} onLoad={() => { setImgLoaded(true); onImageLoad?.(); }} alt="Shared in message" className={`${imgLoaded ? "block" : "hidden"} max-h-[360px] w-auto max-w-[min(300px,68vw)] rounded-xl object-cover`} />
          </button>
        )}

        <div className={`mt-1 flex w-full items-center px-1 text-[11px] text-zinc-400 dark:text-zinc-500 ${ownMessage ? "justify-between" : "justify-start gap-1"}`}>
          {ownMessage && (
            <span className="flex items-center gap-0.5">
              <button type="button" onClick={() => onReply?.(message)} title="Reply" aria-label="Reply to message" className="hidden items-center gap-1 rounded-md px-1.5 py-1 text-zinc-500 opacity-0 transition hover:bg-zinc-100 hover:text-indigo-600 focus:opacity-100 group-hover:opacity-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-indigo-300 md:inline-flex"><FiCornerUpLeft size={13} /> Reply</button>
              <button type="button" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); openActionsAt(rect.left + rect.width / 2, rect.top); }} title="More message actions" aria-label="More message actions" className="hidden h-7 w-7 place-items-center rounded-full text-zinc-500 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-900 focus:opacity-100 group-hover:opacity-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white md:grid"><FiMoreHorizontal size={15} /></button>
            </span>
          )}
          {!ownMessage && <span>{formattedTime}</span>}
          {ownMessage && (
            <span className="ml-auto inline-flex items-center gap-1">
              {formattedTime && <span>{formattedTime}</span>}
              <span className={message.seen ? "text-indigo-500" : "text-zinc-400"}><BsCheck2All size={14} /></span>
            </span>
          )}
          {!ownMessage && (
            <span className="ml-1 hidden items-center gap-0.5 md:inline-flex">
              <button type="button" onClick={() => onReply?.(message)} title="Reply" aria-label="Reply to message" className="hidden items-center gap-1 rounded-md px-1.5 py-1 text-zinc-500 opacity-0 transition hover:bg-zinc-100 hover:text-indigo-600 focus:opacity-100 group-hover:opacity-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-indigo-300 md:inline-flex"><FiCornerUpLeft size={13} /> Reply</button>
              <button type="button" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); openActionsAt(rect.left + rect.width / 2, rect.top); }} title="More message actions" aria-label="More message actions" className="hidden h-7 w-7 place-items-center rounded-full text-zinc-500 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-900 focus:opacity-100 group-hover:opacity-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white md:grid"><FiMoreHorizontal size={15} /></button>
            </span>
          )}
        </div>
      </div>

      {actionsOpen && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Message actions"
          style={menuPosition}
          className="fixed z-[110] w-44 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 text-zinc-700 shadow-xl shadow-zinc-950/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-black/40"
        >
          <button type="button" role="menuitem" onClick={copyMessage} className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"><FiCopy size={15} /> Copy</button>
          <button type="button" role="menuitem" onClick={() => { onReply?.(message); setActionsOpen(false); }} className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"><FiCornerUpLeft size={15} /> Reply</button>
          {ownMessage && <button type="button" role="menuitem" onClick={deleteMessage} className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"><FiTrash2 size={15} /> Delete</button>}
        </div>,
        document.body
      )}

      {imageOpen && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Shared image" onClick={() => setImageOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6">
          <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
            <a href={downloadUrl} download={`spools-image-${message._id || "message"}`} onClick={(event) => event.stopPropagation()} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur hover:bg-white/25"><FiDownload size={17} /> Save image</a>
            <button type="button" aria-label="Close image" onClick={() => setImageOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"><FiX size={19} /></button>
          </div>
          <img src={message.img} alt="Shared image enlarged" onClick={(event) => event.stopPropagation()} className="max-h-[88vh] max-w-[94vw] rounded-xl object-contain shadow-2xl" />
        </div>,
        document.body
      )}
    </div>
  );
};

export default Message;
