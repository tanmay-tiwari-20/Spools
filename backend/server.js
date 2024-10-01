import express from "express";
import dotenv from "dotenv";
import connectDb from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload"; // Import express-fileupload
import userRoutes from "./Routes/userRoutes.js";
import postRoutes from "./Routes/postRoutes.js";
import { v2 as cloudinary } from "cloudinary";

dotenv.config(); // Load environment variables

// Connect to database
connectDb();

const app = express();
const PORT = process.env.PORT || 5000;

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware setup
app.use(express.json({ limit: "100mb" })); // Parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // Parse form data in the req.body
app.use(cookieParser()); // Parse cookies in the req.headers

// Setup express-fileupload middleware
app.use(
  fileUpload({
    useTempFiles: true, // Temporarily save files before uploading
    tempFileDir: "/tmp/", // Directory for storing temp files
  })
);

// Routes
app.use("/api/users", userRoutes); // User-related routes
app.use("/api/posts", postRoutes); // Post-related routes

// Start the server
app.listen(PORT, () => console.log(`Server started at ${PORT}`));
