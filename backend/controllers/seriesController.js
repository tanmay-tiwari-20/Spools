import SpoolSeries from "../models/spoolSeriesModel.js";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";

const canContribute = (series, userId) => series.creator.toString() === userId.toString() || series.collaborators.some((id) => id.toString() === userId.toString());

export const listSeries = async (_req, res) => {
  try {
    const series = await SpoolSeries.find().populate("creator", "username profilePic").populate("collaborators", "username profilePic").sort({ updatedAt: -1 });
    res.json(series);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createSeries = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    if (!title) return res.status(400).json({ error: "Series title is required" });
    const usernames = [...new Set((req.body.collaborators || []).map((name) => name.trim().replace(/^@/, "")).filter(Boolean))];
    const users = usernames.length ? await User.find({ username: { $in: usernames } }).select("_id username") : [];
    const missing = usernames.filter((name) => !users.some((user) => user.username.toLowerCase() === name.toLowerCase()));
    if (missing.length) return res.status(400).json({ error: `Couldn't find collaborator: ${missing.join(", ")}` });
    const series = await SpoolSeries.create({ title, description: req.body.description || "", creator: req.user._id, collaborators: users.filter((user) => user._id.toString() !== req.user._id.toString()).map((user) => user._id) });
    await series.populate(["creator", "collaborators"], "username profilePic");
    res.status(201).json(series);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const addSeriesPart = async (req, res) => {
  try {
    const series = await SpoolSeries.findById(req.params.id);
    if (!series) return res.status(404).json({ error: "Series not found" });
    if (!canContribute(series, req.user._id)) return res.status(403).json({ error: "Only series collaborators can add a part" });
    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ error: "Write something for this part" });
    if (text.length > 500) return res.status(400).json({ error: "A spool can contain up to 500 characters" });
    const post = await Post.create({ postedBy: req.user._id, text, series: series._id, seriesPart: series.parts.length + 1 });
    series.parts.push(post._id);
    await series.save();
    await post.populate("postedBy", "name username profilePic isFrozen");
    res.status(201).json({ post, series });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getSeries = async (req, res) => {
  try {
    const series = await SpoolSeries.findById(req.params.id).populate("creator", "username profilePic").populate("collaborators", "username profilePic").populate({ path: "parts", populate: { path: "postedBy", select: "name username profilePic isFrozen" } });
    if (!series) return res.status(404).json({ error: "Series not found" });
    res.json(series);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
