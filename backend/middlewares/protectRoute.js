import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      // Clear expired or invalid cookie immediately
      res.cookie("jwt", "", { maxAge: 1, httpOnly: true, sameSite: "strict" });
      return res.status(401).json({
        error: "Unauthorized",
        message: "Session expired or invalid token",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.cookie("jwt", "", { maxAge: 1, httpOnly: true, sameSite: "strict" });
      return res.status(401).json({ error: "Unauthorized", message: "User not found" });
    }

    if (user.isFrozen) {
      res.cookie("jwt", "", { maxAge: 1, httpOnly: true, sameSite: "strict" });
      return res.status(401).json({ error: "Unauthorized", message: "This account is frozen. Log in to reactivate it." });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message, message: err.message });
    console.error("Error in protectRoute: ", err.message);
  }
};

export const optionalAuth = async (req, _res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("_id username");
    }
  } catch {
    req.user = null;
  }
  next();
};

export default protectRoute;
