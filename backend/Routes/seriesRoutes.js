import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { addSeriesPart, createSeries, getSeries, listSeries } from "../controllers/seriesController.js";

const router = express.Router();
router.get("/", protectRoute, listSeries);
router.post("/", protectRoute, createSeries);
router.get("/:id", protectRoute, getSeries);
router.post("/:id/parts", protectRoute, addSeriesPart);
export default router;
