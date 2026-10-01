import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

const SeriesPage = () => {
  const { id } = useParams();
  const user = useRecoilValue(userAtom);
  const toast = useShowToast();
  const [seriesList, setSeriesList] = useState([]);
  const [series, setSeries] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [partText, setPartText] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (id) { const res = await fetch(`/api/series/${id}`); const data = await res.json(); setSeries(data.error ? null : data); return; }
    const res = await fetch("/api/series"); const data = await res.json(); setSeriesList(Array.isArray(data) ? data : []);
  }, [id]);
  useEffect(() => { refresh().catch((error) => toast("Error", error.message, "error")); }, [refresh, toast]);
  const create = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const res = await fetch("/api/series", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, collaborators: collaborators.split(",") }) }); const data = await res.json(); if (data.error) throw new Error(data.error); window.location.assign(`/series/${data._id}`); }
    catch (error) { toast("Error", error.message, "error"); } finally { setBusy(false); }
  };
  const addPart = async (event) => {
    event.preventDefault(); if (!partText.trim()) return; setBusy(true);
    try { const res = await fetch(`/api/series/${id}/parts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: partText }) }); const data = await res.json(); if (data.error) throw new Error(data.error); setPartText(""); await refresh(); }
    catch (error) { toast("Error", error.message, "error"); } finally { setBusy(false); }
  };

  if (id && series) {
    const canContribute = [series.creator?._id, ...(series.collaborators || []).map((person) => person._id)].some((personId) => String(personId) === String(user?._id));
    return <main className="max-w-2xl mx-auto space-y-4"><Link to="/series" className="text-sm text-zinc-500">← All series</Link><header className="rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800"><h1 className="text-2xl font-bold">{series.title}</h1><p className="text-sm text-zinc-500 mt-2">{series.description}</p><p className="text-xs text-zinc-400 mt-3">Started by @{series.creator?.username} · {series.parts?.length || 0} parts</p><p className="text-xs text-zinc-400 mt-1">Collaborators: {series.collaborators?.map((person) => `@${person.username}`).join(", ") || "Just the creator"}</p></header>
      {canContribute && <form onSubmit={addPart} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3"><label className="text-sm font-semibold">Add the next part<textarea value={partText} onChange={(e) => setPartText(e.target.value)} maxLength={500} rows={3} placeholder="Continue the story or idea..." className="mt-2 w-full resize-y rounded-xl p-3 bg-zinc-100 dark:bg-zinc-800 outline-none font-normal"/></label><button disabled={busy || !partText.trim()} className="rounded-full px-4 py-2 text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-40">Add part</button></form>}
      <div className="space-y-3">{series.parts?.map((part) => <article key={part._id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800"><div className="text-xs font-semibold text-zinc-400 mb-2">PART {part.seriesPart} · @{part.postedBy?.username}</div><p className="text-sm whitespace-pre-line">{part.text}</p></article>)}</div>
    </main>;
  }
  return <main className="max-w-2xl mx-auto space-y-5"><header><h1 className="text-2xl font-bold">Collaborative Spools</h1><p className="text-sm text-zinc-500 mt-1">Build a story, guide, or idea together, one part at a time.</p></header>
    <form onSubmit={create} className="grid gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Give your series a title" className="rounded-xl px-3 py-2 bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/><input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} placeholder="What will you make together?" className="rounded-xl px-3 py-2 bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/><input value={collaborators} onChange={(e) => setCollaborators(e.target.value)} placeholder="Collaborator usernames, separated by commas" className="rounded-xl px-3 py-2 bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/><span className="text-xs text-zinc-400">Collaborators can add the next part to your series.</span><button disabled={busy || !title.trim()} className="justify-self-end rounded-full px-4 py-2 text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-40">Start a series</button></form>
    <div className="grid gap-3">{seriesList.map((item) => <Link key={item._id} to={`/series/${item._id}`} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"><div className="font-semibold">{item.title}</div><p className="text-sm text-zinc-500 mt-1">{item.description}</p><span className="text-xs text-zinc-400 mt-2 inline-block">{item.parts?.length || 0} parts · by @{item.creator?.username}</span></Link>)}</div>
  </main>;
};
export default SeriesPage;
