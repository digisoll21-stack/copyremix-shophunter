import { Router } from "express";
import { 
  getUsers, 
  updateUserRole, 
  getSystemConfig, 
  updateSystemConfig, 
  getStats 
} from "../controllers/adminController.ts";
import { authorizeAdmin } from "../middleware/auth.ts";

const router = Router();

// All admin routes require admin authorization
router.use(authorizeAdmin);

router.get("/users", getUsers);
router.patch("/users/:userId/role", updateUserRole);
router.get("/config", getSystemConfig);
router.post("/config", updateSystemConfig);
router.get("/stats", getStats);

export default router;
