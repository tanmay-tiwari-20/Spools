import mongoose from "mongoose";

const spoolSeriesSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 240, default: "" },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  restrictedContributors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  parts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
}, { timestamps: true });

export default mongoose.model("SpoolSeries", spoolSeriesSchema);
