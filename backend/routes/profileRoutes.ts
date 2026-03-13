import { Router } from "express";
import * as profileController from "../controllers/profileController.ts";
import { authenticate } from "../middleware/auth.ts";

const router = Router();

router.use(authenticate);

router.get("/", profileController.getProfiles);
router.post("/", profileController.saveProfile);
router.delete("/:id", profileController.deleteProfile);

export default router;
