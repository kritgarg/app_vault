import { documentService } from "../services/document.service.js";
import { documentStorageService } from "../services/documentStorage.service.js";
import { activityService } from "../services/activity.service.js";
import { prisma } from "../utils/prisma.js";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const documentController = {
  uploadDocument: async (req, res) => {
    try {
      const file = req.file;
      const { title, category } = req.body;
      const userId = req.user.id;

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      if (!title) {
        return res.status(400).json({ error: "Document title is required" });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ error: "Invalid file type. Only PDF, JPG, and PNG are allowed." });
      }

      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ error: "File size exceeds the 10MB limit." });
      }

      // 1. Upload to Supabase
      const fileUrl = await documentStorageService.uploadDocument(file, userId);

      // Parse expiryDate
      let parsedExpiryDate = null;
      if (req.body.expiryDate) {
        const d = new Date(req.body.expiryDate);
        if (!isNaN(d.getTime())) {
          parsedExpiryDate = d;
        }
      }

      // 2. Save metadata to Prisma
      const newDocument = await documentService.createDocument({
        userId,
        title,
        category: category || "Other",
        expiryDate: parsedExpiryDate,
        fileUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      });

      await activityService.logActivity({
        userId,
        entityId: newDocument.id,
        type: "DOCUMENT",
        action: "CREATED",
        metadata: { title: newDocument.title, fileName: newDocument.fileName }
      });

      return res.status(201).json(newDocument);
    } catch (error) {
      console.error("Document upload error:", error);
      return res.status(500).json({ error: error.message || "Failed to upload document" });
    }
  },

  getUserDocuments: async (req, res) => {
    try {
      const documents = await documentService.getUserDocuments(req.user.id);
      return res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      return res.status(500).json({ error: "Failed to fetch documents" });
    }
  },

  getDocument: async (req, res) => {
    try {
      const document = await documentService.getDocumentById(req.params.id, req.user.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Generate a temporary signed URL if the stored fileUrl is a Supabase path
      if (document.fileUrl && !document.fileUrl.startsWith("http")) {
        document.fileUrl = await documentStorageService.getSignedUrl(document.fileUrl);
      }

      await activityService.logActivity({
        userId: req.user.id,
        entityId: document.id,
        type: "DOCUMENT",
        action: "VIEWED",
        metadata: { title: document.title }
      });

      return res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      return res.status(500).json({ error: "Failed to fetch document" });
    }
  },

  deleteDocument: async (req, res) => {
    try {
      // 1. Get the document metadata to find the Supabase path
      const document = await documentService.getDocumentById(req.params.id, req.user.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // 2. Delete the file from Supabase storage
      if (document.fileUrl && !document.fileUrl.startsWith("http")) {
        await documentStorageService.deleteDocument(document.fileUrl);
      }

      // 3. Delete metadata from Prisma
      await documentService.deleteDocument(req.params.id, req.user.id);

      await activityService.logActivity({
        userId: req.user.id,
        entityId: req.params.id,
        type: "DOCUMENT",
        action: "DELETED",
        metadata: { title: document.title }
      });

      return res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete document error:", error);
      return res.status(500).json({ error: "Failed to delete document" });
    }
  },

  toggleFavorite: async (req, res) => {
    try {
      const document = await documentService.getDocumentById(req.params.id, req.user.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const updated = await prisma.document.update({
        where: { id: req.params.id },
        data: { favorite: !document.favorite },
      });

      return res.json(updated);
    } catch (error) {
      console.error("Toggle document favorite error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
