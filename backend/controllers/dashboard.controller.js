import { prisma } from "../utils/prisma.js";
import { activityService } from "../services/activity.service.js";

import { decrypt } from "../utils/encryption.js";

export const dashboardController = {
  getDashboardData: async (req, res) => {
    try {
      const userId = req.user.id;

      // 1. Total Counts
      const [totalCards, totalPasswords, totalDocuments] = await Promise.all([
        prisma.card.count({ where: { userId } }),
        prisma.password.count({ where: { userId } }),
        prisma.document.count({ where: { userId } }),
      ]);

      // 2. Recent Items (last 5 each)
      let [recentCards, recentPasswords, recentDocuments] = await Promise.all([
        prisma.card.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, bank: true, bankName: true, network: true, encryptedCardNumber: true, createdAt: true },
        }),
        prisma.password.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, username: true, createdAt: true },
        }),
        prisma.document.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, fileName: true, category: true, createdAt: true },
        }),
      ]);

      recentCards = recentCards.map((card) => {
        let cardNumberMasked = "xxxx";
        try {
          if (card.encryptedCardNumber) {
            const decrypted = decrypt(card.encryptedCardNumber);
            cardNumberMasked = "**** **** **** " + decrypted.slice(-4);
          }
        } catch (e) {
          console.error(`Failed to decrypt card number for card ${card.id}`);
        }
        return {
          ...card,
          cardNumber: cardNumberMasked,
          encryptedCardNumber: undefined,
        };
      });

      // 3. Upcoming Expiries (next 90 days)
      const now = new Date();
      const next90Days = new Date();
      next90Days.setDate(now.getDate() + 90);

      const [expiringCards, expiringDocuments] = await Promise.all([
        prisma.card.findMany({
          where: {
            userId,
            expiryDate: {
              gte: now,
              lte: next90Days,
            },
          },
          select: { id: true, name: true, expiryDate: true },
          orderBy: { expiryDate: "asc" },
        }),
        prisma.document.findMany({
          where: {
            userId,
            expiryDate: {
              gte: now,
              lte: next90Days,
            },
          },
          select: { id: true, title: true, expiryDate: true },
          orderBy: { expiryDate: "asc" },
        }),
      ]);

      const upcomingExpiries = [
        ...expiringCards.map(c => ({ type: "CARD", ...c })),
        ...expiringDocuments.map(d => ({ type: "DOCUMENT", ...d })),
      ].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      // 4. Recent Activity
      const recentActivity = await activityService.getRecentActivity(userId, 10);

      return res.json({
        counts: {
          cards: totalCards,
          passwords: totalPasswords,
          documents: totalDocuments,
        },
        recents: {
          cards: recentCards,
          passwords: recentPasswords,
          documents: recentDocuments,
        },
        expiries: upcomingExpiries,
        activity: recentActivity,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      return res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  },

  getActivity: async (req, res) => {
    try {
      const activity = await activityService.getRecentActivity(req.user.id, 50);
      return res.json(activity);
    } catch (error) {
      console.error("Activity fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch activity" });
    }
  }
};
