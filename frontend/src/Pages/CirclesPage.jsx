import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { FiArrowLeft, FiCheck, FiLock, FiPlus, FiSettings, FiTrash2, FiUsers } from "react-icons/fi";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import Post from "../Components/Post";

const request = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
};

const buttonStyle = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50";

const CirclesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useRecoilValue(userAtom);
  const toast = useShowToast();
  const [circles, setCircles] = useState([]);
  const [circleData, setCircleData] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [postText, setPostText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (id) {
        const data = await request(`/api/circles/${id}`);
        setCircleData(data);
        setName(data.circle?.name || "");
        setDescription(data.circle?.description || "");
      } else {
        const data = await request("/api/circles");
        setCircles(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh().catch((error) => toast("Error", error.message, "error"));
  }, [refresh, toast]);

  const createCircle = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await request("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      setName("");
      setDescription("");
      toast("Success", "Your circle is ready", "success");
      await refresh();
    } catch (error) {
      toast("Could not create circle", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const membership = async (action) => {
    setBusy(true);
    try {
      await request(`/api/circles/${id}/${action}`, { method: "PUT" });
      await refresh();
    } catch (error) {
      toast("Could not update membership", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const createPost = async (event) => {
    event.preventDefault();
    if (!postText.trim()) return;
    setBusy(true);
    try {
      await request("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postedBy: user._id, text: postText.trim(), circle: id }),
      });
      setPostText("");
      await refresh();
    } catch (error) {
      toast("Could not publish", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const saveCircle = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await request(`/api/circles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      await refresh();
      toast("Circle updated", "Your changes have been saved.", "success");
    } catch (error) {
      toast("Could not update circle", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const togglePosting = async (memberId, canPost) => {
    setBusy(true);
    try {
      await request(`/api/circles/${id}/members/${memberId}/posting`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canPost }),
      });
      await refresh();
    } catch (error) {
      toast("Could not change posting access", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteCircle = async () => {
    if (!window.confirm("Delete this circle? Its posts will remain on Spools as regular posts.")) return;
    setBusy(true);
    try {
      await request(`/api/circles/${id}`, { method: "DELETE" });
      toast("Circle deleted", "Its posts are still available on Spools.", "success");
      navigate("/circles", { replace: true });
    } catch (error) {
      toast("Could not delete circle", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (id && loading && !circleData) {
    return <main className="max-w-4xl mx-auto p-6 text-sm text-zinc-500">Loading circle…</main>;
  }
  if (id && !circleData) {
    return <main className="max-w-4xl mx-auto space-y-3"><p className="text-sm text-zinc-500">This circle could not be loaded.</p><Link to="/circles" className="text-sm font-semibold">← All circles</Link></main>;
  }

  if (id && circleData) {
    const circle = circleData.circle;
    const isCreator = String(circle.creator?._id) === String(user?._id);
    const joined = isCreator || circle.members?.some((member) => String(member?._id || member) === String(user?._id));
    const canPost = isCreator || !circle.restrictedMembers?.some((member) => String(member?._id || member) === String(user?._id));
    const members = circle.members || [];

    return (
      <main className="max-w-5xl mx-auto space-y-5 pb-8">
        <Link to="/circles" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          <FiArrowLeft /> All circles
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-sm">
          <div className="h-28 sm:h-40 bg-indigo-700 relative overflow-hidden">
            <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-[34px] border-white/10" />
            <div className="absolute right-24 -bottom-28 h-48 w-48 rounded-full border border-white/10" />
            <span className="absolute left-5 bottom-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
              <FiUsers /> {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>
          <div className="p-5 sm:p-7 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-indigo-500 font-bold">Circle</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white mt-1">{circle.name}</h1>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 mt-2 max-w-2xl whitespace-pre-line">{circle.description || "A place for people who share an interest."}</p>
              <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                <img src={circle.creator?.profilePic || "/defaultdp.png"} alt="" className="w-6 h-6 rounded-full object-cover" />
                <span>Created by <strong className="text-zinc-800 dark:text-zinc-200">@{circle.creator?.username}</strong></span>
                {isCreator && <span className="rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-1 font-bold">Admin</span>}
              </div>
            </div>
            {!isCreator && (
              <button type="button" disabled={busy} onClick={() => membership(joined ? "leave" : "join")} className={`${buttonStyle} shrink-0 ${joined ? "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200" : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"}`}>
                {joined ? "Leave circle" : <><FiPlus /> Join circle</>}
              </button>
            )}
          </div>
        </section>

        {isCreator && (
          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"><FiSettings /></span>
              <div><h2 className="font-bold text-zinc-900 dark:text-white">Circle management</h2><p className="text-xs text-zinc-500 mt-0.5">You are the admin. Update details and decide who can post.</p></div>
            </div>
            <form onSubmit={saveCircle} className="grid sm:grid-cols-[1fr_1.5fr_auto] gap-3 items-end">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Circle name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Description<input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
              <button disabled={busy} className={`${buttonStyle} bg-zinc-900 text-white dark:bg-white dark:text-zinc-900`}><FiCheck /> Save</button>
            </form>
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
              <div className="flex items-center justify-between gap-3 mb-3"><h3 className="text-sm font-bold">Posting access</h3><span className="text-xs text-zinc-400">{members.length} members</span></div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {members.map((member) => {
                  const memberId = String(member?._id || member);
                  const creator = memberId === String(circle.creator?._id);
                  const allowed = creator || !circle.restrictedMembers?.some((restricted) => String(restricted?._id || restricted) === memberId);
                  return <div key={memberId} className="flex items-center gap-3 py-3">
                    <img src={member?.profilePic || "/defaultdp.png"} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate">@{member.username || "member"}</p><p className="text-xs text-zinc-500">{creator ? "Creator · always allowed to post" : allowed ? "Can post in the circle" : "Posting is paused"}</p></div>
                    {!creator && <button type="button" role="switch" aria-checked={allowed} aria-label={`${allowed ? "Pause" : "Allow"} posting for @${member.username}`} disabled={busy} onClick={() => togglePosting(memberId, !allowed)} className={`w-12 h-7 rounded-full p-1 transition-colors ${allowed ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"}`}><span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${allowed ? "translate-x-5" : "translate-x-0"}`} /></button>}
                  </div>;
                })}
              </div>
            </div>
            <div className="border-t border-rose-100 dark:border-rose-950/50 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div><h3 className="text-sm font-bold text-rose-700 dark:text-rose-300">Delete circle</h3><p className="text-xs text-zinc-500 mt-1">Members lose access. Existing posts remain as regular posts.</p></div>
              <button type="button" disabled={busy} onClick={deleteCircle} className={`${buttonStyle} text-rose-700 border border-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-900 dark:hover:bg-rose-950/30`}><FiTrash2 /> Delete circle</button>
            </div>
          </section>
        )}

        {joined && canPost ? (
          <form onSubmit={createPost} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
            <textarea value={postText} onChange={(event) => setPostText(event.target.value)} maxLength={500} rows={2} placeholder={`Share something with ${circle.name}…`} className="min-w-0 flex-1 resize-y rounded-2xl bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
            <button disabled={busy || !postText.trim()} className={`${buttonStyle} self-end sm:self-end bg-indigo-600 text-white hover:bg-indigo-500`}><FiPlus /> Share post</button>
          </form>
        ) : joined && !canPost ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 px-4 py-3 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200"><FiLock /> The creator has paused your posting access. You can still read this circle.</div>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-end justify-between"><div><h2 className="text-lg font-bold">Circle posts</h2><p className="text-xs text-zinc-500 mt-1">Ideas and updates from the community</p></div><span className="text-xs text-zinc-400">{circleData.posts?.length || 0} posts</span></div>
          {circleData.posts?.length ? circleData.posts.map((post) => <Post key={post._id} post={post} postedBy={post.postedBy} />) : <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center"><div className="mx-auto mb-3 grid w-12 h-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800"><FiUsers /></div><p className="font-semibold">No posts yet</p><p className="text-sm text-zinc-500 mt-1">Be the first to start a conversation in this circle.</p></div>}
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto space-y-7 pb-8">
      <header className="relative overflow-hidden rounded-[2rem] bg-indigo-700 p-6 sm:p-9 text-white shadow-lg shadow-indigo-950/10">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[36px] border-white/10" />
        <div className="relative max-w-2xl"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/75"><FiUsers /> Community</span><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Find your circle.</h1><p className="text-sm sm:text-base text-white/80 mt-2">Create a space for your interests, share updates, and bring people together.</p></div>
      </header>

      <section className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] gap-5 items-start">
        <div>
          <div className="flex items-end justify-between mb-4"><div><h2 className="text-xl font-bold">Explore circles</h2><p className="text-sm text-zinc-500 mt-1">Communities started by Spools members</p></div><span className="text-xs text-zinc-400">{circles.length} total</span></div>
          {loading ? <div className="grid sm:grid-cols-2 gap-3">{[0, 1, 2].map((item) => <div key={item} className="h-36 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div> : circles.length ? <div className="grid sm:grid-cols-2 gap-3">{circles.map((circle, index) => <Link key={circle._id} to={`/circles/${circle._id}`} className="group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all">
            <div className={`absolute inset-x-0 top-0 h-1 ${["bg-indigo-500", "bg-violet-500", "bg-sky-500", "bg-fuchsia-500"][index % 4]}`} />
            <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">{circle.name}</h3><span className="shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-500 inline-flex items-center gap-1"><FiUsers /> {circle.members?.length || 0}</span></div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-3 min-h-[3.75rem]">{circle.description || "A place for people who share an interest."}</p>
            <div className="flex items-center gap-2 mt-4 text-xs text-zinc-400"><img src={circle.creator?.profilePic || "/defaultdp.png"} alt="" className="w-6 h-6 rounded-full object-cover" /> Started by @{circle.creator?.username || "member"}</div>
          </Link>)}</div> : <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center"><p className="font-semibold">No circles yet</p><p className="text-sm text-zinc-500 mt-1">Create one and invite people around a shared interest.</p></div>}
        </div>

        <form onSubmit={createCircle} className="lg:sticky lg:top-24 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3"><span className="grid place-items-center w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"><FiPlus /></span><div><h2 className="font-bold">Start a circle</h2><p className="text-xs text-zinc-500">You’ll be its admin</p></div></div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">Name<input required value={name} onChange={(event) => setName(event.target.value)} maxLength={50} placeholder="e.g. Weekend photographers" className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">What’s it about?<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} rows={3} placeholder="Tell people what this community is for…" className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
          <p className="text-xs text-zinc-400">As admin, you can edit the circle and manage members’ posting access.</p>
          <button disabled={busy || !name.trim()} className={`${buttonStyle} w-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950`}><FiPlus /> Create circle</button>
        </form>
      </section>
    </main>
  );
};

export default CirclesPage;
