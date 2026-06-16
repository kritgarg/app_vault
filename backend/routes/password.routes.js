import express from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { activityService } from "../services/activity.service.js";

const router = express.Router();

// Apply auth requirement to all password endpoints
router.use(requireAuth);

// 1. Create Password: POST /passwords
router.post("/", async (req, res) => {
  const { title, username, password, website, notes, category, favorite } = req.body;

  if (!title || !password) {
    return res.status(400).json({ error: "Title and password are required" });
  }

  try {
    const encryptedPassword = encrypt(password);
    const encryptedNotes = notes ? encrypt(notes) : null;

    const newPassword = await prisma.password.create({
      data: {
        userId: req.user.id,
        title,
        username: username || null,
        encryptedPassword,
        website: website || null,
        encryptedNotes,
        category: category || "Other",
        favorite: favorite || false,
      },
      select: {
        id: true,
        title: true,
        username: true,
        website: true,
        category: true,
        favorite: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await activityService.logActivity({
      userId: req.user.id,
      entityId: newPassword.id,
      type: "PASSWORD",
      action: "CREATED",
      metadata: { title: newPassword.title, username: newPassword.username }
    });

    return res.status(201).json(newPassword);
  } catch (error) {
    console.error("Create password error:", error);
    return res.status(500).json({ error: "Failed to create password" });
  }
});

// 2. Get All Passwords: GET /passwords
router.get("/", async (req, res) => {
  try {
    const passwords = await prisma.password.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        title: true,
        username: true,
        website: true,
        category: true,
        favorite: true,
        createdAt: true,
        updatedAt: true,
        // Do NOT return encryptedPassword or encryptedNotes here for safety
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(passwords);
  } catch (error) {
    console.error("Get passwords error:", error);
    return res.status(500).json({ error: "Failed to retrieve passwords" });
  }
});

// 3. Get Password Details: GET /passwords/:id
router.get("/:id", async (req, res) => {
  try {
    const password = await prisma.password.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        username: true,
        website: true,
        category: true,
        favorite: true,
        createdAt: true,
        updatedAt: true,
        // Wait, should we send encrypted data? The original card logic doesn't send it until reveal.
      },
    });

    if (!password) {
      return res.status(404).json({ error: "Password not found" });
    }

    return res.json(password);
  } catch (error) {
    console.error("Get password details error:", error);
    return res.status(500).json({ error: "Failed to retrieve password details" });
  }
});

// 4. Reveal Password Credentials: POST /passwords/:id/reveal
router.post("/:id/reveal", async (req, res) => {
  try {
    const passwordRecord = await prisma.password.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!passwordRecord) {
      return res.status(404).json({ error: "Password not found" });
    }

    return res.json({
      password: decrypt(passwordRecord.encryptedPassword),
      notes: passwordRecord.encryptedNotes ? decrypt(passwordRecord.encryptedNotes) : null,
    });
  } catch (error) {
    console.error("Reveal password error:", error);
    return res.status(500).json({ error: "Failed to reveal password" });
  }
});

// 5. Update Password: PUT /passwords/:id
router.put("/:id", async (req, res) => {
  const { title, username, password, website, notes, category, favorite } = req.body;

  try {
    // Check if exists
    const existing = await prisma.password.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Password not found" });
    }

    const dataToUpdate = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (username !== undefined) dataToUpdate.username = username || null;
    if (website !== undefined) dataToUpdate.website = website || null;
    if (category !== undefined) dataToUpdate.category = category || "Other";
    if (favorite !== undefined) dataToUpdate.favorite = favorite;

    if (password) {
      dataToUpdate.encryptedPassword = encrypt(password);
    }

    if (notes !== undefined) {
      dataToUpdate.encryptedNotes = notes ? encrypt(notes) : null;
    }

    const updated = await prisma.password.update({
      where: { id: existing.id },
      data: dataToUpdate,
      select: {
        id: true,
        title: true,
        username: true,
        website: true,
        category: true,
        favorite: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await activityService.logActivity({
      userId: req.user.id,
      entityId: updated.id,
      type: "PASSWORD",
      action: "UPDATED",
      metadata: { title: updated.title, username: updated.username }
    });

    return res.json(updated);
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({ error: "Failed to update password" });
  }
});

// 6. Delete Password: DELETE /passwords/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.password.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Password not found" });
    }

    await prisma.password.delete({
      where: { id: existing.id },
    });

    await activityService.logActivity({
      userId: req.user.id,
      entityId: existing.id,
      type: "PASSWORD",
      action: "DELETED",
      metadata: { title: existing.title }
    });

    return res.json({ success: true, message: "Password deleted successfully" });
  } catch (error) {
    console.error("Delete password error:", error);
    return res.status(500).json({ error: "Failed to delete password" });
  }
});

export default router;
