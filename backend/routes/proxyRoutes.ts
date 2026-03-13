import { Router } from "express";
import * as proxyController from "../controllers/proxyController.ts";
import { authenticate } from "../middleware/auth.ts";
import { proxyLimiter } from "../middleware/limiters.ts";

const router = Router();

router.use(authenticate);
router.use(proxyLimiter);

router.post("/wappalyzer", proxyController.proxyWappalyzer);
router.post("/serper", proxyController.proxySerper);
router.post("/dataforseo/seo", proxyController.proxyDataForSEOSeo);
router.post("/dataforseo/traffic", proxyController.proxyDataForSEOTraffic);
router.post("/apollo", proxyController.proxyApollo);
router.post("/hunter", proxyController.proxyHunter);
router.post("/claude", proxyController.proxyClaude);

export default router;
