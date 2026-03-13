import { Router } from "express";
import * as leadController from "../controllers/leadController.ts";
import { authenticate } from "../middleware/auth.ts";

const router = Router();

router.use(authenticate);

router.get("/", leadController.getLeads);
router.post("/", leadController.saveLeads);
router.post("/hunt", leadController.startHunt);
router.get("/jobs", leadController.getJobs);
router.patch("/:url", leadController.updateLead);
router.delete("/:url", leadController.deleteLead);
router.post("/verify-email", leadController.verifyEmail);

export default router;
