import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import userAtom from "../atoms/userAtom";
import { useRecoilValue } from "recoil";
import useShowToast from "../hooks/useShowToast";
import Post from "../Components/Post";

const CirclesPage = () => {
  const { id } = useParams();
  const user = useRecoilValue(userAtom);
  const toast = useShowToast();
  const [circles, setCircles] = useState([]);
  const [circleData, setCircleData] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [postText, setPostText] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (id) {
      const res = await fetch(`/api/circles/${id}`); const data = await res.json();
      setCircleData(data.error ? null : data); return;
    }
    const res = await fetch("/api/circles"); const data = await res.json(); setCircles(Array.isArray(data) ? data : []);
  }, [id]);
  useEffect(() => { refresh().catch((error) => toast("Error", error.message, "error")); }, [refresh, toast]);

  const createCircle = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const res = await fetch("/api/circles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) }); const data = await res.json(); if (data.error) throw new Error(data.error); setName(""); setDescription(""); toast("Success", "Circle created", "success"); await refresh(); }
    catch (error) { toast("Error", error.message, "error"); } finally { setBusy(false); }
  };
  const membership = async (action) => {
    const res = await fetch(`/api/circles/${id}/${action}`, { method: "PUT" }); const data = await res.json();
    if (data.error) return toast("Error", data.error, "error"); await refresh();
  };
  const createPost = async (event) => {
    event.preventDefault(); if (!postText.trim()) return; setBusy(true);
    try { const res = await fetch("/api/posts/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postedBy: user._id, text: postText, circle: id }) }); const data = await res.json(); if (data.error) throw new Error(data.error); setPostText(""); await refresh(); }
    catch (error) { toast("Error", error.message, "error"); } finally { setBusy(false); }
  };

  if (id && circleData) {
    const circle = circleData.circle;
    const joined = circle.members.some((member) => String(member) === String(user?._id));
    return <main className="max-w-2xl mx-auto space-y-4">
      <Link to="/circles" className="text-sm text-zinc-500">← All circles</Link>
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900/50">
        <div className="flex justify-between items-start gap-3"><div><h1 className="text-xl font-bold">{circle.name}</h1><p className="text-sm text-zinc-500 mt-1">{circle.description || "A place for people who share an interest."}</p><p className="text-xs text-zinc-400 mt-2">{circle.members.length} members</p></div>
          <button onClick={() => membership(joined ? "leave" : "join")} className="rounded-full px-4 py-2 text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">{joined ? "Leave" : "Join"}</button></div>
      </section>
      {joined && <form onSubmit={createPost} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex gap-2"><input value={postText} onChange={(e) => setPostText(e.target.value)} maxLength={500} placeholder={`Share with ${circle.name}`} className="min-w-0 flex-1 bg-transparent outline-none text-sm"/><button disabled={busy || !postText.trim()} className="rounded-full px-4 py-2 text-sm bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-40">Post</button></form>}
      {circleData.posts.map((post) => <Post key={post._id} post={post} postedBy={post.postedBy} />)}
    </main>;
  }
  return <main className="max-w-2xl mx-auto space-y-5"><header><h1 className="text-2xl font-bold">Circles</h1><p className="text-sm text-zinc-500 mt-1">Small communities built around what you care about.</p></header>
    <form onSubmit={createCircle} className="grid gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="Name your circle" className="rounded-xl px-3 py-2 bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/><input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} placeholder="What is it about?" className="rounded-xl px-3 py-2 bg-zinc-100 dark:bg-zinc-800 outline-none text-sm"/><button disabled={busy || !name.trim()} className="justify-self-end rounded-full px-4 py-2 text-sm font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-40">Create circle</button></form>
    <div className="grid gap-3">{circles.map((circle) => <Link key={circle._id} to={`/circles/${circle._id}`} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"><div className="font-semibold">{circle.name}</div><p className="text-sm text-zinc-500 mt-1">{circle.description}</p><span className="text-xs text-zinc-400 mt-2 inline-block">{circle.members.length} members</span></Link>)}</div>
  </main>;
};
export default CirclesPage;
