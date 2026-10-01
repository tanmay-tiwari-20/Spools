import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiLoader, FiX } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";

const FollowPeopleModal = ({ isOpen, onClose, user, type, onRequestResolved }) => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const showToast = useShowToast();
  const isRequests = type === "requests";
  const title = isRequests ? "Follow requests" : type === "followers" ? "Followers" : "Following";

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const loadPeople = async () => {
      setLoading(true);
      try {
        const endpoint = isRequests
          ? "/api/users/follow-requests"
          : `/api/users/${user._id}/${type}`;
        const response = await fetch(endpoint);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load this list.");
        if (!cancelled) setPeople(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) showToast("Could not load list", error.message, "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPeople();
    return () => { cancelled = true; };
  }, [isOpen, isRequests, type, user._id, showToast]);

  const resolveRequest = async (person, approve) => {
    setBusyId(person._id);
    try {
      const response = await fetch(`/api/users/follow-requests/${person._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.error || "Could not update this request.");
      setPeople((previous) => previous.filter((item) => item._id !== person._id));
      onRequestResolved?.(approve);
      showToast(approve ? "Request approved" : "Request declined", `@${person.username}’s request was ${approve ? "approved" : "declined"}.`, "success");
    } catch (error) {
      showToast("Could not update request", error.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3 sm:p-5" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div><h2 className="font-bold text-zinc-900 dark:text-white">{title}</h2><p className="mt-0.5 text-xs text-zinc-500">{isRequests ? "Choose who can follow your private profile." : `People connected with @${user.username}.`}</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><FiX /></button>
        </header>
        <div className="max-h-[min(65vh,480px)] overflow-y-auto p-3">
          {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500"><FiLoader className="animate-spin" /> Loading…</div>
            : people.length ? <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{people.map((person) => <div key={person._id} className="flex items-center gap-3 px-2 py-3">
              <Link to={`/${person.username}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3">
                <img src={person.profilePic || "/defaultdp.png"} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-zinc-900 dark:text-white">{person.name || `@${person.username}`}</span><span className="block truncate text-xs text-zinc-500">@{person.username}</span></span>
              </Link>
              {isRequests && <div className="flex shrink-0 items-center gap-1.5">
                <button type="button" aria-label={`Approve @${person.username}`} disabled={busyId === person._id} onClick={() => resolveRequest(person, true)} className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"><FiCheck /></button>
                <button type="button" aria-label={`Decline @${person.username}`} disabled={busyId === person._id} onClick={() => resolveRequest(person, false)} className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"><FiX /></button>
              </div>}
            </div>)}</div>
            : <div className="px-4 py-12 text-center"><p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{isRequests ? "No pending requests" : `No ${type} yet`}</p><p className="mt-1 text-xs text-zinc-500">{isRequests ? "New requests will appear here." : "This list will appear here as it grows."}</p></div>}
        </div>
      </section>
    </div>
  );
};

export default FollowPeopleModal;
