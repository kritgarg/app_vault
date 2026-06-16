import { prisma } from "../utils/prisma.js";

export const activityService = {
  /**
   * Log an activity asynchronously
   */
  logActivity: async ({ userId, entityId, type, action, metadata = null }) => {
    try {
      await prisma.activity.create({
        data: {
          userId,
          entityId,
          type,
          action,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      // Non-blocking log, fail silently
      console.error("Failed to log activity:", error.message);
    }
  },

  /**
   * Get recent activities for a user
   */
  getRecentActivity: async (userId, limit = 10) => {
    return prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
