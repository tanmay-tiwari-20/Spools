import Circle from "../models/circleModel.js";
import Post from "../models/postModel.js";

export const listCircles = async (_req, res) => {
  try {
    const circles = await Circle.find().populate("creator", "username profilePic").sort({ members: -1, createdAt: -1 });
    res.json(circles);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createCircle = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ error: "Circle name is required" });
    const circle = await Circle.create({ name, description: req.body.description || "", creator: req.user._id, members: [req.user._id] });
    await circle.populate("creator", "username profilePic");
    res.status(201).json(circle);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const joinCircle = async (req, res) => {
  try {
    const circle = await Circle.findByIdAndUpdate(req.params.id, { $addToSet: { members: req.user._id } }, { new: true }).populate("creator", "username profilePic");
    if (!circle) return res.status(404).json({ error: "Circle not found" });
    res.json(circle);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const leaveCircle = async (req, res) => {
  try {
    const circle = await Circle.findByIdAndUpdate(req.params.id, { $pull: { members: req.user._id } }, { new: true }).populate("creator", "username profilePic");
    if (!circle) return res.status(404).json({ error: "Circle not found" });
    res.json(circle);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id).populate("creator", "username profilePic");
    if (!circle) return res.status(404).json({ error: "Circle not found" });
    const posts = await Post.find({ circle: circle._id }).populate("postedBy", "name username profilePic isFrozen").sort({ createdAt: -1 });
    res.json({ circle, posts });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
