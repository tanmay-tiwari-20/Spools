import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const getUserProfile = async (req, res) => {
  // We will fetch user profile either with username or userId
  // query is either username or userId
  const { query } = req.params;

  try {
    let user;

    // query is userId
    if (mongoose.Types.ObjectId.isValid(query)) {
      user = await User.findOne({ _id: query })
        .select("-password")
        .select("-updatedAt");
    } else {
      // query is username
      user = await User.findOne({ username: query })
        .select("-password")
        .select("-updatedAt");
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in getUserProfile: ", err.message);
  }
};

// Signup user
const signupUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Check if a user with the same email or username already exists
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
      bio: "", // Initialize bio as an empty string (or provide default)
      profilePic: "", // Initialize profilePic as an empty string (or provide default)
      followers: [],
      following: [],
    });

    // Save the new user to the database
    await newUser.save();

    if (newUser) {
      // Generate JWT token and set it as a cookie
      generateTokenAndSetCookie(newUser._id, res);

      // Respond with the newly created user data
      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio, // Include bio
        profilePic: newUser.profilePic, // Include profilePic
        followers: newUser.followers,
        following: newUser.following,
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in signup: ", err.message);
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { password, username } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Generate and set the token in cookies
    generateTokenAndSetCookie(user._id, res);

    // Return the full user data, including bio and profilePic
    res.status(200).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio, // Include bio
      profilePic: user.profilePic, // Include profilePic
      followers: user.followers,
      following: user.following,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in login: ", err.message);
  }
};

// Logout user
const logoutUser = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 1 });
    res.status(200).json({ message: "User logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in logout: ", err.message);
  }
};

// Follow / Unfollow user
const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString())
      return res
        .status(400)
        .json({ error: "You cannot follow/unfollow yourself." });

    if (!userToModify)
      return res.status(400).json({ error: "User not found." });

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // Unfollow user
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      res.status(200).json({ message: "User unfollowed" });
    } else {
      // Follow user
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      res.status(200).json({ message: "User followed" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in follow/unfollow user: ", err.message);
  }
};

// Update user profile
const updateUser = async (req, res) => {
  const { name, email, username, password, bio } = req.body;
  let profilePic = req.files?.profilePic
    ? req.files.profilePic.tempFilePath
    : null; // Get profilePic from files

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" }); // 404 for not found

    if (req.params.id !== userId.toString())
      return res
        .status(403)
        .json({ error: "You cannot update another user's profile" }); // 403 for forbidden access

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }

    if (profilePic) {
      if (user.profilePic) {
        // Extract public id from the existing profilePic URL
        const publicId = user.profilePic.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`spools/profile-pics/${publicId}`);
      }

      const uploadedResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "spools/profile-pics",
      });
      profilePic = uploadedResponse.secure_url; // Update profilePic URL
    }

    user.name = name !== undefined ? name : user.name; // Check for undefined
    user.email = email !== undefined ? email : user.email; // Check for undefined
    user.username = username !== undefined ? username : user.username; // Check for undefined
    user.profilePic = profilePic || user.profilePic; // Fallback to existing profilePic
    user.bio = bio !== undefined ? bio : user.bio; // Check for undefined

    user = await user.save();

    // Update username and userProfilePic fields in replies
    await Post.updateMany(
      { "replies.userId": userId },
      {
        $set: {
          "replies.$[reply].username": user.username,
          "replies.$[reply].userProfilePic": user.profilePic,
        },
      },
      { arrayFilters: [{ "reply.userId": userId }] }
    );

    user.password = null; // Do not send password in response

    res.status(200).json(user);
  } catch (err) {
    console.log("Error in updateUser: ", err.message);
    res.status(500).json({ error: err.message });
  }
};

export {
  signupUser,
  loginUser,
  logoutUser,
  followUser,
  updateUser,
  getUserProfile,
};
