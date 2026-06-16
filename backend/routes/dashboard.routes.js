import express from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", dashboardController.getDashboardData);
router.get("/activity", dashboardController.getActivity);

export default router;
