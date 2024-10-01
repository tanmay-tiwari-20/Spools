import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

// Create a new post
const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;
    let { img } = req.body;

    // Ensure necessary fields are provided
    if (!postedBy || !text) {
      return res
        .status(400)
        .json({ error: "Text field is required." });
    }

    // Check if the user exists
    const user = await User.findById(postedBy);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Ensure the user creating the post is the logged-in user
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized to create a post." });
    }

    // Ensure the text does not exceed maximum length
    const maxLength = 500;
    if (text.length > maxLength) {
      return res.status(400).json({
        error: `Text field should not exceed ${maxLength} characters.`,
      });
    }

    // Handle image upload to Cloudinary if provided
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img, {
        folder: "spools/posts",
      });
      img = uploadedResponse.secure_url; // Update the image URL
    }

    // Create a new post
    const newPost = new Post({ postedBy, text, img });

    // Save the post to the database
    await newPost.save();

    res.status(201).json({ message: "Post created successfully", newPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error: ", err.message);
  }
};

// Get a single post by ID
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post exists
    if (!post) return res.status(404).json({ error: "Post not found." });

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in getPost: ", err.message);
  }
};

// Delete a post
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Ensure post exists
    if (!post) return res.status(404).json({ error: "Post not found." });

    // Ensure the user requesting the delete is the owner of the post
    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "Unauthorized to delete this post." });
    }

    // Delete the post
    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Post deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Like or unlike a post
const likeUnlikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    // Ensure the post exists
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Ensure post.likes is an array
    if (!Array.isArray(post.likes)) {
      post.likes = []; // Initialize likes if it's not an array
    }

    const userLikedPost = post.likes.includes(userId);
    if (userLikedPost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      res.status(200).json({ message: "Post unliked successfully" });
    } else {
      // Like post
      post.likes.push(userId);
      await post.save();
      res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in likeUnlikePost: ", err.message);
  }
};

// Reply to a post
const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;
    const userProfilePic = req.user.userProfilePic; // Assuming this is available in req.user
    const username = req.body.username; // Assuming this is passed in the body

    // Ensure the reply text is provided
    if (!text) {
      return res.status(400).json({ error: "Reply text is required." });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found." });

    // Create a reply object
    const reply = { userId, text, userProfilePic, username };

    // Add reply to the post's replies array
    post.replies.push(reply);
    await post.save();

    res.status(200).json({ message: "Reply added successfully", post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get feed posts from users the current user is following
const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const following = user.following; // Get list of users the current user is following

    // Find posts from the users the current user is following, sorted by creation date
    const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({
      createdAt: -1,
    });

    res.status(200).json(feedPosts);
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
};
