import SpoolSeries from "../models/spoolSeriesModel.js";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";

const canContribute = (series, userId) => series.creator.toString() === userId.toString() || series.collaborators.some((id) => id.toString() === userId.toString());
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isCreator = (series, userId) => String(series.creator) === String(userId);

const findCollaborators = async (usernames) => {
  if (!usernames.length) return [];
  return User.find({
    $or: usernames.map((username) => ({
      username: { $regex: `^${escapeRegex(username)}$`, $options: "i" },
    })),
  }).select("_id username");
};

export const listSeries = async (_req, res) => {
  try {
    const series = await SpoolSeries.find().populate("creator", "username profilePic").populate("collaborators", "username profilePic").sort({ updatedAt: -1 });
    res.json(series);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createSeries = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim() || "";
    if (!title) return res.status(400).json({ error: "Series title is required" });
    if (title.length > 80 || description.length > 240) return res.status(400).json({ error: "Series details are too long." });
    if (req.body.collaborators !== undefined && !Array.isArray(req.body.collaborators)) {
      return res.status(400).json({ error: "Collaborators must be a list of usernames." });
    }
    const usernames = [...new Set((req.body.collaborators || []).map((name) => String(name).trim().replace(/^@/, "")).filter(Boolean))];
    const users = await findCollaborators(usernames);
    const missing = usernames.filter((name) => !users.some((user) => user.username.toLowerCase() === name.toLowerCase()));
    if (missing.length) return res.status(400).json({ error: `Couldn't find collaborator: ${missing.join(", ")}` });
    const series = await SpoolSeries.create({ title, description, creator: req.user._id, collaborators: users.filter((user) => user._id.toString() !== req.user._id.toString()).map((user) => user._id) });
    await series.populate([
      { path: "creator", select: "username profilePic" },
      { path: "collaborators", select: "username profilePic" },
    ]);
    res.status(201).json(series);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const addSeriesPart = async (req, res) => {
  try {
    const series = await SpoolSeries.findById(req.params.id);
    if (!series) return res.status(404).json({ error: "Series not found" });
    if (!canContribute(series, req.user._id)) return res.status(403).json({ error: "Only series collaborators can add a part" });
    if (!isCreator(series, req.user._id) && series.restrictedContributors.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: "The series creator has paused your contribution access" });
    }
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

export const updateSeries = async (req, res) => {
  try {
    const series = await SpoolSeries.findById(req.params.id);
    if (!series) return res.status(404).json({ error: "Series not found" });
    if (!isCreator(series, req.user._id)) return res.status(403).json({ error: "Only the series creator can manage it." });

    const title = req.body.title?.trim();
    const description = req.body.description?.trim() || "";
    if (!title) return res.status(400).json({ error: "Series title is required." });
    if (title.length > 80 || description.length > 240) return res.status(400).json({ error: "Series details are too long." });

    let collaborators = series.collaborators;
    if (Array.isArray(req.body.collaborators)) {
      const usernames = [...new Set(req.body.collaborators.map((name) => String(name).trim().replace(/^@/, "")).filter(Boolean))];
      const users = await findCollaborators(usernames);
      const missing = usernames.filter((name) => !users.some((user) => user.username.toLowerCase() === name.toLowerCase()));
      if (missing.length) return res.status(400).json({ error: `Couldn't find collaborator: ${missing.join(", ")}` });
      collaborators = users.filter((user) => user._id.toString() !== req.user._id.toString()).map((user) => user._id);
      series.collaborators = collaborators;
      series.restrictedContributors = series.restrictedContributors.filter((id) =>
        collaborators.some((collaboratorId) => collaboratorId.toString() === id.toString())
      );
    }

    series.title = title;
    series.description = description;
    await series.save();
    await series.populate([
      { path: "creator", select: "username profilePic" },
      { path: "collaborators", select: "username profilePic" },
    ]);
    return res.status(200).json(series);
  } catch (error) { return res.status(500).json({ error: error.message }); }
};

export const setSeriesContributorPermission = async (req, res) => {
  try {
    const { collaboratorId } = req.params;
    const { canContribute: hasAccess } = req.body;
    if (typeof hasAccess !== "boolean") return res.status(400).json({ error: "Choose whether this collaborator can contribute." });

    const series = await SpoolSeries.findById(req.params.id);
    if (!series) return res.status(404).json({ error: "Series not found" });
    if (!isCreator(series, req.user._id)) return res.status(403).json({ error: "Only the series creator can manage contributor access." });
    if (String(collaboratorId) === String(series.creator)) return res.status(400).json({ error: "The creator always has contribution access." });
    if (!series.collaborators.some((id) => String(id) === String(collaboratorId))) return res.status(404).json({ error: "Series collaborator not found." });

    if (hasAccess) series.restrictedContributors.pull(collaboratorId);
    else if (!series.restrictedContributors.some((id) => String(id) === String(collaboratorId))) series.restrictedContributors.push(collaboratorId);
    await series.save();
    return res.status(200).json({ restrictedContributors: series.restrictedContributors });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};

export const deleteSeries = async (req, res) => {
  try {
    const series = await SpoolSeries.findById(req.params.id);
    if (!series) return res.status(404).json({ error: "Series not found" });
    if (!isCreator(series, req.user._id)) return res.status(403).json({ error: "Only the series creator can delete it." });

    await Post.updateMany({ series: series._id }, { $unset: { series: 1, seriesPart: 1 } });
    await series.deleteOne();
    return res.status(200).json({ success: true });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};
