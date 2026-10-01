import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { FiArrowLeft, FiBookOpen, FiCheck, FiLock, FiPlus, FiSettings, FiTrash2, FiUsers } from "react-icons/fi";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

const request = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
};

const buttonStyle = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50";

const SeriesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useRecoilValue(userAtom);
  const toast = useShowToast();
  const [seriesList, setSeriesList] = useState([]);
  const [series, setSeries] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [partText, setPartText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request(id ? `/api/series/${id}` : "/api/series");
      if (id) {
        setSeries(data);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCollaborators(data.collaborators?.map((person) => person.username).join(", ") || "");
      } else {
        setSeriesList(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh().catch((error) => toast("Error", error.message, "error"));
  }, [refresh, toast]);

  const create = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await request("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          collaborators: collaborators.split(",").map((name) => name.trim()).filter(Boolean),
        }),
      });
      if (!data._id) throw new Error("The series was created but the server did not return its details.");
      navigate(`/series/${data._id}`);
    } catch (error) {
      toast("Could not create series", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const addPart = async (event) => {
    event.preventDefault();
    if (!partText.trim()) return;
    setBusy(true);
    try {
      await request(`/api/series/${id}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: partText.trim() }),
      });
      setPartText("");
      await refresh();
    } catch (error) {
      toast("Could not add part", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const saveSeries = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await request(`/api/series/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          collaborators: collaborators.split(",").map((name) => name.trim()).filter(Boolean),
        }),
      });
      await refresh();
      toast("Series updated", "Your changes have been saved.", "success");
    } catch (error) {
      toast("Could not update series", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const toggleContributor = async (collaboratorId, canContribute) => {
    setBusy(true);
    try {
      await request(`/api/series/${id}/contributors/${collaboratorId}/permission`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canContribute }),
      });
      await refresh();
    } catch (error) {
      toast("Could not change contribution access", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteSeries = async () => {
    if (!window.confirm("Delete this series? Its parts will remain on Spools as regular posts.")) return;
    setBusy(true);
    try {
      await request(`/api/series/${id}`, { method: "DELETE" });
      toast("Series deleted", "Its parts are still available on Spools.", "success");
      navigate("/series", { replace: true });
    } catch (error) {
      toast("Could not delete series", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (id && loading && !series) return <main className="max-w-5xl mx-auto p-6 text-sm text-zinc-500">Loading series…</main>;
  if (id && !series) return <main className="max-w-5xl mx-auto space-y-3"><p className="text-sm text-zinc-500">This series could not be loaded.</p><Link to="/series" className="text-sm font-semibold">← All series</Link></main>;

  if (id && series) {
    const isCreator = String(series.creator?._id) === String(user?._id);
    const contributors = series.collaborators || [];
    const isCollaborator = contributors.some((person) => String(person._id) === String(user?._id));
    const canContribute = isCreator || (isCollaborator && !series.restrictedContributors?.some((personId) => String(personId?._id || personId) === String(user?._id)));
    return (
      <main className="max-w-5xl mx-auto space-y-5 pb-8">
        <Link to="/series" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><FiArrowLeft /> All series</Link>

        <header className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 sm:p-9 text-white shadow-lg shadow-slate-950/15">
          <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-20 flex h-[22rem] rotate-[28deg] gap-3 opacity-90">
            <span className="h-full w-8 rounded-full bg-indigo-500/45" />
            <span className="h-full w-14 rounded-full bg-white/10" />
            <span className="h-full w-3 rounded-full bg-sky-300/50" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70"><FiBookOpen /> Collaborative series</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">{series.title}</h1>
            <p className="text-sm sm:text-base text-white/80 mt-2 max-w-2xl whitespace-pre-line">{series.description || "A shared story or idea, built one part at a time."}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 text-xs text-white/75">
              <span className="inline-flex items-center gap-2"><img src={series.creator?.profilePic || "/defaultdp.png"} alt="" className="w-6 h-6 rounded-full object-cover" /> Started by @{series.creator?.username}</span>
              <span className="inline-flex items-center gap-1.5"><FiBookOpen /> {series.parts?.length || 0} parts</span>
              <span className="inline-flex items-center gap-1.5"><FiUsers /> {contributors.length + 1} contributors</span>
              {isCreator && <span className="rounded-full bg-white/15 px-2.5 py-1 font-bold text-white">Admin</span>}
            </div>
          </div>
        </header>

        {isCreator && (
          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-3"><span className="rounded-xl p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"><FiSettings /></span><div><h2 className="font-bold">Series management</h2><p className="text-xs text-zinc-500 mt-0.5">You are the admin. Manage details and contributor access.</p></div></div>
            <form onSubmit={saveSeries} className="grid gap-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Series title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Collaborator usernames<input value={collaborators} onChange={(event) => setCollaborators(event.target.value)} placeholder="alex, sam" className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
              </div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} rows={2} className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><p className="text-xs text-zinc-400">Enter usernames separated by commas. Removed collaborators can no longer add parts.</p><button disabled={busy} className={`${buttonStyle} bg-zinc-900 text-white dark:bg-white dark:text-zinc-900`}><FiCheck /> Save changes</button></div>
            </form>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
              <div className="flex items-center justify-between gap-3 mb-3"><h3 className="text-sm font-bold">Contribution access</h3><span className="text-xs text-zinc-400">{contributors.length} collaborators</span></div>
              {contributors.length ? <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{contributors.map((person) => {
                const allowed = !series.restrictedContributors?.some((personId) => String(personId?._id || personId) === String(person._id));
                return <div key={person._id} className="flex items-center gap-3 py-3"><img src={person.profilePic || "/defaultdp.png"} alt="" className="w-9 h-9 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate">@{person.username}</p><p className="text-xs text-zinc-500">{allowed ? "Can add parts" : "Contribution access is paused"}</p></div><button type="button" role="switch" aria-checked={allowed} aria-label={`${allowed ? "Pause" : "Allow"} contributions for @${person.username}`} disabled={busy} onClick={() => toggleContributor(person._id, !allowed)} className={`w-12 h-7 rounded-full p-1 transition-colors ${allowed ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"}`}><span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${allowed ? "translate-x-5" : "translate-x-0"}`} /></button></div>;
              })}</div> : <p className="text-sm text-zinc-500 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 p-4">Add collaborators above to let others continue this series.</p>}
            </div>

            <div className="border-t border-rose-100 dark:border-rose-950/50 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h3 className="text-sm font-bold text-rose-700 dark:text-rose-300">Delete series</h3><p className="text-xs text-zinc-500 mt-1">The series is removed; its parts remain as regular posts.</p></div><button type="button" disabled={busy} onClick={deleteSeries} className={`${buttonStyle} text-rose-700 border border-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-900 dark:hover:bg-rose-950/30`}><FiTrash2 /> Delete series</button></div>
          </section>
        )}

        {canContribute ? (
          <form onSubmit={addPart} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 sm:p-5 space-y-3">
            <div><h2 className="font-bold">Continue the series</h2><p className="text-xs text-zinc-500 mt-1">Add the next part, up to 500 characters.</p></div>
            <textarea value={partText} onChange={(event) => setPartText(event.target.value)} maxLength={500} rows={3} placeholder="Write the next part…" className="w-full resize-y rounded-2xl bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex items-center justify-between gap-3"><span className="text-xs text-zinc-400">{partText.length}/500</span><button disabled={busy || !partText.trim()} className={`${buttonStyle} bg-indigo-600 text-white hover:bg-indigo-500`}><FiPlus /> Add part</button></div>
          </form>
        ) : isCollaborator ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 px-4 py-3 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200"><FiLock /> The creator has paused your contribution access. You can still read the series.</div>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-end justify-between"><div><h2 className="text-xl font-bold">The series so far</h2><p className="text-sm text-zinc-500 mt-1">Read the parts in order</p></div><span className="text-xs text-zinc-400">{series.parts?.length || 0} parts</span></div>
          {series.parts?.length ? <div className="relative space-y-3 before:absolute before:left-[1.125rem] before:top-5 before:bottom-5 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">{series.parts.map((part) => <article key={part._id} className="relative ml-0 sm:ml-1 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 sm:p-5 pl-14 shadow-sm"><span className="absolute left-2.5 top-4 grid w-7 h-7 place-items-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-extrabold">{part.seriesPart}</span><div className="flex items-center gap-2 mb-3"><img src={part.postedBy?.profilePic || "/defaultdp.png"} alt="" className="w-7 h-7 rounded-full object-cover"/><span className="text-xs font-semibold text-zinc-500">Part {part.seriesPart} · @{part.postedBy?.username || "member"}</span></div><p className="text-sm leading-6 whitespace-pre-line text-zinc-800 dark:text-zinc-200">{part.text}</p></article>)}</div> : <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center"><p className="font-semibold">The first part is waiting</p><p className="text-sm text-zinc-500 mt-1">Start the story or invite a collaborator to begin.</p></div>}
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto space-y-7 pb-8">
      <header className="rounded-[2rem] bg-slate-900 p-6 sm:p-9 text-white shadow-lg shadow-slate-950/15 relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-20 flex h-[22rem] rotate-[28deg] gap-3 opacity-90">
          <span className="h-full w-8 rounded-full bg-indigo-500/45" />
          <span className="h-full w-14 rounded-full bg-white/10" />
          <span className="h-full w-3 rounded-full bg-sky-300/50" />
        </div>
        <div className="relative z-10 max-w-2xl"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70"><FiBookOpen /> Create together</span><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">A good idea grows in parts.</h1><p className="text-sm sm:text-base text-white/80 mt-2">Start a shared story, guide, or project and invite people to write the next chapter.</p></div>
      </header>

      <section className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] gap-5 items-start">
        <div>
          <div className="flex items-end justify-between mb-4"><div><h2 className="text-xl font-bold">Explore series</h2><p className="text-sm text-zinc-500 mt-1">Stories and ideas being built by the community</p></div><span className="text-xs text-zinc-400">{seriesList.length} total</span></div>
          {loading ? <div className="grid sm:grid-cols-2 gap-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div> : seriesList.length ? <div className="grid sm:grid-cols-2 gap-3">{seriesList.map((item) => <Link key={item._id} to={`/series/${item._id}`} className="group rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all"><div className="flex items-center justify-between gap-3"><span className="grid place-items-center w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"><FiBookOpen /></span><span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-500">{item.parts?.length || 0} parts</span></div><h3 className="font-bold text-base mt-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{item.title}</h3><p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-3 min-h-[3.75rem]">{item.description || "A collaborative story or idea."}</p><div className="flex items-center gap-2 mt-4 text-xs text-zinc-400"><img src={item.creator?.profilePic || "/defaultdp.png"} alt="" className="w-6 h-6 rounded-full object-cover"/> By @{item.creator?.username || "member"}</div></Link>)}</div> : <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center"><p className="font-semibold">No series yet</p><p className="text-sm text-zinc-500 mt-1">Create the first one and invite collaborators.</p></div>}
        </div>

        <form onSubmit={create} className="lg:sticky lg:top-24 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3"><span className="grid place-items-center w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"><FiPlus /></span><div><h2 className="font-bold">Start a series</h2><p className="text-xs text-zinc-500">You’ll be its admin</p></div></div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">Title<input required value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="e.g. A beginner’s guide to film" className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} rows={2} placeholder="What are you making together?" className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">Collaborators <span className="font-normal text-zinc-400">(optional)</span><input value={collaborators} onChange={(event) => setCollaborators(event.target.value)} placeholder="username, another_username" className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
          <p className="text-xs text-zinc-400">As admin, you can invite or remove collaborators and pause contribution access.</p>
          <button disabled={busy || !title.trim()} className={`${buttonStyle} w-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950`}><FiPlus /> Create series</button>
        </form>
      </section>
    </main>
  );
};

export default SeriesPage;
