import express from "express";
import dotenv from "dotenv";
import connectDb from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./Routes/userRoutes.js";
import postRoutes from "./Routes/postRoutes.js";

dotenv.config();

connectDb();
const app = express();

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json()); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data in the req.body
app.use(cookieParser()); // To parse cookies in the req.headers

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.listen(PORT, console.log(`Server started at ${PORT}`));
