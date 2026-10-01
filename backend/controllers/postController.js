import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import Circle from "../models/circleModel.js";
import { deliverUserNotification } from "../utils/webPush.js";
import { canViewPost, canViewPrivateProfile } from "../utils/profilePrivacy.js";

const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;
    const replyPermission = ["everyone", "followers", "mentioned"].includes(req.body.replyPermission)
      ? req.body.replyPermission
      : "everyone";
    const circleId = req.body.circle || null;
    let { img } = req.body;

    if (!postedBy || !text) {
      return res
        .status(400)
        .json({ error: "Postedby and text fields are required" });
    }

    const user = await User.findById(postedBy);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized to create post" });
    }

    const maxLength = 500;
    if (text.length > maxLength) {
      return res
        .status(400)
        .json({ error: `Text must be less than ${maxLength} characters` });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    if (circleId) {
      const circle = await Circle.findById(circleId).select("creator members restrictedMembers");
      if (!circle) return res.status(404).json({ error: "Circle not found" });
      if (!circle.members.some((member) => member.toString() === req.user._id.toString())) {
        return res.status(403).json({ error: "Join this circle before posting" });
      }
      const isCreator = circle.creator.toString() === req.user._id.toString();
      if (!isCreator && circle.restrictedMembers.some((member) => member.toString() === req.user._id.toString())) {
        return res.status(403).json({ error: "The circle creator has paused your posting access" });
      }
    }

    const newPost = new Post({ postedBy, text, img, replyPermission, circle: circleId });
    await newPost.save();
    await newPost.populate("postedBy", "name username profilePic isFrozen");

    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err);
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "postedBy",
      "name username profilePic isFrozen isPrivate followers"
    );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (!canViewPrivateProfile(post.postedBy, req.user?._id)) {
      return res.status(403).json({ error: "This spool belongs to a private profile." });
    }

    const postData = post.toObject();
    if (postData.postedBy) {
      delete postData.postedBy.followers;
      delete postData.postedBy.isPrivate;
    }
    res.status(200).json(postData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized to delete post" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (!await canViewPost(post, userId)) return res.status(403).json({ error: "This spool belongs to a private profile." });

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      res.status(200).json({ message: "Post unliked successfully" });
    } else {
      // Like post
      post.likes.push(userId);
      await post.save();
      if (post.postedBy.toString() !== userId.toString()) {
        const owner = await User.findById(post.postedBy).select("username");
        if (owner) {
          void deliverUserNotification(owner._id, {
            type: "like",
            title: "New like",
            body: `@${req.user.username} liked your spool.`,
            url: `/${owner.username}/post/${post._id}`,
            tag: `like-${post._id}-${userId}`,
          });
        }
      }
      res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;
    const userProfilePic = req.user.profilePic;
    const username = req.user.username;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (!await canViewPost(post, userId)) return res.status(403).json({ error: "This spool belongs to a private profile." });

    if (post.postedBy.toString() !== userId.toString()) {
      const mentionsUser = [...(post.text || "").matchAll(/(^|\s)@([\w.-]+)/g)].some((match) => match[2].toLowerCase() === username.toLowerCase());
      if (post.replyPermission === "mentioned" && !mentionsUser) {
        return res.status(403).json({ error: "Only people mentioned in this spool can reply" });
      }
      if (post.replyPermission === "followers") {
        const author = await User.findById(post.postedBy).select("followers");
        const isFollower = author?.followers?.some((id) => id.toString() === userId.toString());
        if (!isFollower) return res.status(403).json({ error: "Only the author's followers can reply" });
      }
    }

    const reply = { userId, text, userProfilePic, username };

    post.replies.push(reply);
    await post.save();

    if (post.postedBy.toString() !== userId.toString()) {
      const owner = await User.findById(post.postedBy).select("username");
      if (owner) {
        void deliverUserNotification(owner._id, {
          type: "reply",
          title: "New reply",
          body: `@${username}: ${text.slice(0, 120)}`,
          url: `/${owner.username}/post/${post._id}`,
          tag: `reply-${post._id}-${reply._id || Date.now()}`,
        });
      }
    }

    res.status(200).json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const following = (user.following || []).map((id) => id.toString());
    const feedType = req.query.type === "explore" ? "explore" : "following";
    const hiddenPrivateAuthors = feedType === "explore"
      ? await User.find({ isPrivate: true, _id: { $ne: userId }, followers: { $ne: userId.toString() } }).distinct("_id")
      : [];
    const authorFilter = feedType === "explore"
      ? { $nin: [...following, userId.toString(), ...hiddenPrivateAuthors] }
      : { $in: [...following, userId] };
    const feedPosts = await Post.find({ postedBy: authorFilter })
      .populate("postedBy", "name username profilePic isFrozen")
      .sort({ createdAt: -1 });

    res.status(200).json(feedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserPosts = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!canViewPrivateProfile(user, req.user?._id)) return res.status(403).json({ error: "This profile is private. Request to follow to see their spools." });

    const posts = await Post.find({ postedBy: user._id })
      .populate("postedBy", "name username profilePic isFrozen")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserReplies = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!canViewPrivateProfile(user, req.user?._id)) return res.status(403).json({ error: "This profile is private. Request to follow to see their replies." });

    const posts = await Post.find({ "replies.userId": user._id })
      .populate("postedBy", "name username profilePic isFrozen")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const saveUnsavePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isSaved = user.savedPosts?.some((p) => p.toString() === postId);

    if (!isSaved) {
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (!await canViewPost(post, req.user._id)) return res.status(403).json({ error: "This spool belongs to a private profile." });
    }

    if (isSaved) {
      await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postId } });
      res.status(200).json({ message: "Post unsaved successfully", saved: false });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { savedPosts: postId } });
      res.status(200).json({ message: "Post saved successfully", saved: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedPosts",
      populate: {
        path: "postedBy",
        select: "name username profilePic isFrozen",
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const savedPosts = (user.savedPosts || []).filter(Boolean).reverse();
    const visiblePosts = [];
    for (const post of savedPosts) {
      if (await canViewPost(post, req.user._id)) visiblePosts.push(post);
    }
    res.status(200).json(visiblePosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const repostPost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!await canViewPost(post, userId)) return res.status(403).json({ error: "This spool belongs to a private profile." });

    const isReposted = post.reposts?.some(
      (id) => id.toString() === userId.toString()
    );

    if (isReposted) {
      await Post.updateOne({ _id: postId }, { $pull: { reposts: userId } });
      res.status(200).json({ message: "Repost removed", reposted: false });
    } else {
      post.reposts.push(userId);
      await post.save();
      res
        .status(200)
        .json({ message: "Post reposted successfully", reposted: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPosts,
  getUserReplies,
  saveUnsavePost,
  getSavedPosts,
  repostPost,
};
