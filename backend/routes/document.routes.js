import express from "express";
import multer from "multer";
import { documentController } from "../controllers/document.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Use memory storage for Multer so we can upload the buffer directly to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Protect all document routes
router.use(requireAuth);

router.post("/upload", upload.single("file"), documentController.uploadDocument);
router.get("/", documentController.getUserDocuments);
router.get("/:id", documentController.getDocument);
router.patch("/:id/favorite", documentController.toggleFavorite);
router.delete("/:id", documentController.deleteDocument);

export default router;
