import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiSearch, FiSend, FiShare, FiX } from "react-icons/fi";
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
      className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="forward-message-title" className="flex max-h-[min(700px,90dvh)] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[30px] border border-zinc-200/80 bg-white shadow-2xl shadow-black/25 dark:border-zinc-700/80 dark:bg-zinc-900 sm:rounded-[28px]">
        <div className="relative px-5 pb-4 pt-3 sm:pt-5">
          <span aria-hidden="true" className="mx-auto mb-3 block h-1 w-9 rounded-full bg-zinc-300 dark:bg-zinc-700 sm:hidden" />
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-3 grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:right-5 sm:top-4"><FiX size={19} /></button>
          <div className="pr-10 sm:pr-12">
            <h2 id="forward-message-title" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Forward to</h2>
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{previewText}</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="px-4 pb-3 sm:px-5">
          <div className="flex gap-2 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800/90">
            <div className="relative min-w-0 flex-1">
              <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search username" aria-label="Search username" className="h-10 w-full rounded-xl bg-transparent pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:bg-white focus:shadow-sm dark:text-zinc-100 dark:focus:bg-zinc-700" />
            </div>
            <button type="submit" disabled={!query.trim() || isSearching} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-zinc-600 shadow-sm transition hover:text-indigo-600 disabled:opacity-45 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:text-indigo-300" aria-label="Search">
              {isSearching ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent dark:border-indigo-300" /> : <FiSearch size={17} />}
            </button>
          </div>
          {searchError && <p role="status" className="mt-2 text-xs text-rose-600 dark:text-rose-300">{searchError}</p>}
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 sm:px-4">
          {searchResult && !matchingContact && (
            <button type="button" onClick={() => setSelectedUser(searchResult)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${String(selectedUser?._id) === String(searchResult._id) ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
              <img src={searchResult.profilePic || "/defaultdp.png"} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{searchResult.name || `@${searchResult.username}`}</p><p className="truncate text-xs text-zinc-500 dark:text-zinc-400">@{searchResult.username}</p></div>
              <span className={`grid h-6 w-6 place-items-center rounded-full border transition ${String(selectedUser?._id) === String(searchResult._id) ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400 dark:text-zinc-950" : "border-zinc-300 text-transparent dark:border-zinc-600"}`}><FiCheck size={14} /></span>
            </button>
          )}
          <p className="px-3 pb-2 pt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Recent chats</p>
          {contacts.length === 0 && !searchResult ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Search for someone by username to forward this message.</div>
          ) : contacts.map((person) => (
            <button key={person._id} type="button" onClick={() => setSelectedUser(person)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${String(selectedUser?._id) === String(person._id) ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
              <img src={person.profilePic || "/defaultdp.png"} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{person.name || `@${person.username}`}</p><p className="truncate text-xs text-zinc-500 dark:text-zinc-400">@{person.username}</p></div>
              <span className={`grid h-6 w-6 place-items-center rounded-full border transition ${String(selectedUser?._id) === String(person._id) ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400 dark:text-zinc-950" : "border-zinc-300 text-transparent dark:border-zinc-600"}`}><FiCheck size={14} /></span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-900/95 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
            {selectedUser ? <><img src={selectedUser.profilePic || "/defaultdp.png"} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /><span className="truncate font-medium text-zinc-800 dark:text-zinc-200">@{selectedUser.username}</span></> : <span>Choose a chat</span>}
          </div>
          <button type="button" onClick={forwardTo} disabled={!selectedUser || isForwarding} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-900/15 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45">
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
