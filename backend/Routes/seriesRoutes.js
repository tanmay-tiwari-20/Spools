import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { addSeriesPart, createSeries, deleteSeries, getSeries, listSeries, setSeriesContributorPermission, updateSeries } from "../controllers/seriesController.js";

const router = express.Router();
router.get("/", protectRoute, listSeries);
router.post("/", protectRoute, createSeries);
router.put("/:id", protectRoute, updateSeries);
router.delete("/:id", protectRoute, deleteSeries);
router.put("/:id/contributors/:collaboratorId/permission", protectRoute, setSeriesContributorPermission);
router.get("/:id", protectRoute, getSeries);
router.post("/:id/parts", protectRoute, addSeriesPart);
export default router;
