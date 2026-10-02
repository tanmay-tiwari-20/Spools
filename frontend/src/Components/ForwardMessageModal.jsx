import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiSend, FiShare, FiX } from "react-icons/fi";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

const ForwardMessageModal = ({ message, onClose }) => {
  const currentUser = useRecoilValue(userAtom);
  const [conversations, setConversations] = useRecoilState(conversationsAtom);
  const showToast = useShowToast();
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const contacts = useMemo(() => {
    const seen = new Set();
    return conversations.flatMap((conversation) => {
      const person = conversation?.participants?.[0];
      if (!person?._id || String(person._id) === String(currentUser?._id) || seen.has(String(person._id))) return [];
      seen.add(String(person._id));
      return [person];
    });
  }, [conversations, currentUser?._id]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const username = query.trim().replace(/^@/, "");
    if (!username) return;
    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const response = await fetch(`/api/users/profile/${encodeURIComponent(username)}`);
      const person = await response.json();
      if (!response.ok || person.error || !person._id) {
        setSearchError(person.error || "No account found with that username.");
      } else if (String(person._id) === String(currentUser?._id)) {
        setSearchError("You can’t forward a message to yourself.");
      } else {
        setSearchResult(person);
      }
    } catch (error) {
      setSearchError(error.message || "Could not search for that account.");
    } finally {
      setIsSearching(false);
    }
  };

  const forwardTo = async () => {
    if (!selectedUser || isForwarding) return;
    setIsForwarding(true);
    try {
      const response = await fetch(`/api/messages/${message._id}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: selectedUser._id }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Could not forward this message.");

      const conversationsResponse = await fetch("/api/messages/conversations");
      const updatedConversations = await conversationsResponse.json();
      if (conversationsResponse.ok && Array.isArray(updatedConversations)) setConversations(updatedConversations);
      showToast("Forwarded", `Message sent to @${selectedUser.username}.`, "success");
      onClose();
    } catch (error) {
      showToast("Could not forward message", error.message, "error");
    } finally {
      setIsForwarding(false);
    }
  };

  const previewText = message.text || (message.audio ? "Voice message" : message.img ? "Photo" : "Message");
  const matchingContact = searchResult && contacts.some((person) => String(person._id) === String(searchResult._id));

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="forward-message-title" className="flex max-h-[min(680px,90dvh)] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-[28px]">
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4 dark:border-zinc-800 sm:px-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><FiShare size={18} /></span>
          <div className="min-w-0 flex-1">
            <h2 id="forward-message-title" className="text-base font-bold text-zinc-900 dark:text-white">Forward message</h2>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{previewText}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"><FiX size={19} /></button>
        </div>

        <form onSubmit={handleSearch} className="px-4 pt-4 sm:px-5">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search username" aria-label="Search username" className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:bg-zinc-800" />
            </div>
            <button type="submit" disabled={!query.trim() || isSearching} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-45" aria-label="Search">
              {isSearching ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <FiSearch size={17} />}
            </button>
          </div>
          {searchError && <p role="status" className="mt-2 text-xs text-rose-600 dark:text-rose-300">{searchError}</p>}
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {searchResult && !matchingContact && (
            <button type="button" onClick={() => setSelectedUser(searchResult)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${String(selectedUser?._id) === String(searchResult._id) ? "bg-indigo-50 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:ring-indigo-500/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
              <img src={searchResult.profilePic || "/defaultdp.png"} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{searchResult.name || `@${searchResult.username}`}</p><p className="truncate text-xs text-zinc-500 dark:text-zinc-400">@{searchResult.username}</p></div>
              <span className={`h-5 w-5 rounded-full border ${String(selectedUser?._id) === String(searchResult._id) ? "border-[6px] border-indigo-600 dark:border-indigo-400" : "border-zinc-300 dark:border-zinc-600"}`} />
            </button>
          )}
          <p className="px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">Recent chats</p>
          {contacts.length === 0 && !searchResult ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Search for someone by username to forward this message.</div>
          ) : contacts.map((person) => (
            <button key={person._id} type="button" onClick={() => setSelectedUser(person)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${String(selectedUser?._id) === String(person._id) ? "bg-indigo-50 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:ring-indigo-500/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
              <img src={person.profilePic || "/defaultdp.png"} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{person.name || `@${person.username}`}</p><p className="truncate text-xs text-zinc-500 dark:text-zinc-400">@{person.username}</p></div>
              <span className={`h-5 w-5 rounded-full border ${String(selectedUser?._id) === String(person._id) ? "border-[6px] border-indigo-600 dark:border-indigo-400" : "border-zinc-300 dark:border-zinc-600"}`} />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800 sm:px-5">
          <div className="min-w-0 text-sm text-zinc-500 dark:text-zinc-400">{selectedUser ? `To @${selectedUser.username}` : "Choose a person"}</div>
          <button type="button" onClick={forwardTo} disabled={!selectedUser || isForwarding} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-900/15 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45">
            {isForwarding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <FiSend size={15} />}
            Forward
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default ForwardMessageModal;
