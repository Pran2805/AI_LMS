import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadDocument } from "../controllers/document.controller.js";

const router = Router()
// crud documents


router.post("/upload", upload.single('file'), uploadDocument)
// router.get("/", getDocuments)
// router.get("/:id", getDocumentById)
// router.delete("/:id", deleteDocument)
// router.put("/:id", updateDocument)

export default router;