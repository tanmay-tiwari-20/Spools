import Circle from "../models/circleModel.js";
import Post from "../models/postModel.js";
import { canViewPrivateProfile, removeFrozenReplies } from "../utils/profilePrivacy.js";

const isCreator = (circle, userId) => String(circle.creator) === String(userId);
const populateCircle = (query) => query.populate("creator", "username profilePic").populate("members", "username profilePic");
const visibleCirclePosts = async (posts, viewerId) => {
  const visiblePosts = await removeFrozenReplies(posts.filter((post) => canViewPrivateProfile(post.postedBy, viewerId)));
  return visiblePosts.map((result) => {
    if (result.postedBy) {
      delete result.postedBy.followers;
      delete result.postedBy.isPrivate;
    }
    return result;
  });
};

export const listCircles = async (_req, res) => {
  try {
    const circles = await Circle.find().populate("creator", "username profilePic").sort({ createdAt: -1 });
    res.json(circles);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createCircle = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || "";
    if (!name) return res.status(400).json({ error: "Circle name is required" });
    if (name.length > 50 || description.length > 240) return res.status(400).json({ error: "Circle details are too long." });
    const circle = await Circle.create({ name, description, creator: req.user._id, members: [req.user._id] });
    await circle.populate("creator", "username profilePic");
    res.status(201).json(circle);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const joinCircle = async (req, res) => {
  try {
    const circle = await populateCircle(Circle.findByIdAndUpdate(req.params.id, { $addToSet: { members: req.user._id } }, { new: true }));
    if (!circle) return res.status(404).json({ error: "Circle not found" });
    res.json(circle);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const leaveCircle = async (req, res) => {
  try {
    const currentCircle = await Circle.findById(req.params.id);
    if (!currentCircle) return res.status(404).json({ error: "Circle not found" });
    if (isCreator(currentCircle, req.user._id)) return res.status(400).json({ error: "Circle creators cannot leave. Delete the circle if it is no longer needed." });
    const circle = await populateCircle(Circle.findByIdAndUpdate(req.params.id, { $pull: { members: req.user._id } }, { new: true }));
    if (!circle) return res.status(404).json({ error: "Circle not found" });
    res.json(circle);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getCircle = async (req, res) => {
  try {
    const circle = await populateCircle(Circle.findById(req.params.id));
    if (!circle) return res.status(404).json({ error: "Circle not found" });
    const posts = await Post.find({ circle: circle._id }).populate("postedBy", "name username profilePic isFrozen isPrivate followers").sort({ createdAt: -1 });
    res.json({ circle, posts: await visibleCirclePosts(posts, req.user._id) });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ error: "Circle not found" });
    if (!isCreator(circle, req.user._id)) return res.status(403).json({ error: "Only the circle creator can manage it." });

    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || "";
    if (!name) return res.status(400).json({ error: "Circle name is required." });
    if (name.length > 50 || description.length > 240) return res.status(400).json({ error: "Circle details are too long." });

    circle.name = name;
    circle.description = description;
    await circle.save();
    await circle.populate([
      { path: "creator", select: "username profilePic" },
      { path: "members", select: "username profilePic" },
    ]);
    const posts = await Post.find({ circle: circle._id }).populate("postedBy", "name username profilePic isFrozen isPrivate followers").sort({ createdAt: -1 });
    return res.status(200).json({ circle, posts: await visibleCirclePosts(posts, req.user._id) });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};

export const setCircleMemberPosting = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { canPost } = req.body;
    if (typeof canPost !== "boolean") return res.status(400).json({ error: "Choose whether this member can post." });

    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ error: "Circle not found" });
    if (!isCreator(circle, req.user._id)) return res.status(403).json({ error: "Only the circle creator can manage posting access." });
    if (String(memberId) === String(circle.creator)) return res.status(400).json({ error: "The creator always has posting access." });
    if (!circle.members.some((id) => String(id) === String(memberId))) return res.status(404).json({ error: "Circle member not found." });

    if (canPost) circle.restrictedMembers.pull(memberId);
    else if (!circle.restrictedMembers.some((id) => String(id) === String(memberId))) circle.restrictedMembers.push(memberId);
    await circle.save();
    return res.status(200).json({ restrictedMembers: circle.restrictedMembers });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};

export const deleteCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ error: "Circle not found" });
    if (!isCreator(circle, req.user._id)) return res.status(403).json({ error: "Only the circle creator can delete it." });

    await Post.updateMany({ circle: circle._id }, { $unset: { circle: 1 } });
    await circle.deleteOne();
    return res.status(200).json({ success: true });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};
