import express from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { q } = req.query;
  const userId = req.user.id;

  if (!q || typeof q !== "string" || q.trim() === "") {
    return res.json([]);
  }

  const query = q.trim();
  const searchTerms = query.split(/\s+/).map((term) => `%${term}%`);

  try {
    // 1. Search Cards
    // Prisma OR doesn't easily support dynamic multiple terms across multiple fields with ILIKE cleanly without raw SQL,
    // so we'll do a simple approach: fetch all and filter in memory if the dataset is small, 
    // or use Prisma's `contains` with `mode: 'insensitive'`.
    
    const cards = await prisma.card.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { bankName: { contains: query, mode: "insensitive" } },
          { bank: { contains: query, mode: "insensitive" } },
          { network: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        bankName: true,
        bank: true,
      },
    });

    // 2. Search Passwords
    const passwords = await prisma.password.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { website: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        username: true,
      },
    });

    // 3. Search Documents
    const documents = await prisma.document.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { fileName: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        category: true,
      },
    });

    // 4. Format Combined Results
    const combinedResults = [
      ...cards.map((card) => ({
        type: "card",
        id: card.id,
        title: card.name,
        subtitle: card.bankName || card.bank || "Unknown Bank",
      })),
      ...passwords.map((pwd) => ({
        type: "password",
        id: pwd.id,
        title: pwd.title,
        subtitle: pwd.username || "No username",
      })),
      ...documents.map((doc) => ({
        type: "document",
        id: doc.id,
        title: doc.title,
        subtitle: doc.category || doc.fileName || "Document",
      })),
    ];

    return res.json(combinedResults);
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: "Failed to perform global search" });
  }
});

export default router;
