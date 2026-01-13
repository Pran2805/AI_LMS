import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

// router.post("/upload", upload.single('file'), uploadDocument)
export default router;