import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";


const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select(
      "-password -updatedAt"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

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
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save();

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
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

    generateTokenAndSetCookie(user._id, res);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
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
  const userId = req.user._id; // Get the logged-in user's ID

  try {
    // Check if the user exists
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user trying to update is the owner of the profile
    if (req.params.id !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You cannot update another user's profile" });
    }

    // Handle password update if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Handle profile picture update
    if (req.files && req.files.profilePic) {
      const profilePic = req.files.profilePic.tempFilePath; // Ensure this is correct

      // Delete old profile picture from Cloudinary if it exists
      if (user.profilePic) {
        const publicId = user.profilePic.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Upload new profile picture to Cloudinary
      const uploadedResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "spools/profile-pics",
      });
      user.profilePic = uploadedResponse.secure_url; // Update profilePic URL
    }

    // Update other user fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (username) user.username = username;
    if (bio) user.bio = bio;

    // Save updated user to the database
    const updatedUser = await user.save();

    // Exclude the password from the response
    updatedUser.password = undefined;

    // Send back the updated user data
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ error: "Failed to update user" });
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
