import { prisma } from "../utils/prisma.js";

export const documentService = {
  createDocument: async (data) => {
    return prisma.document.create({
      data,
      select: {
        id: true,
        title: true,
        category: true,
        fileUrl: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  getDocumentById: async (id, userId) => {
    return prisma.document.findFirst({
      where: {
        id,
        userId,
      },
    });
  },

  getUserDocuments: async (userId) => {
    return prisma.document.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  deleteDocument: async (id, userId) => {
    return prisma.document.delete({
      where: {
        id,
        userId,
      },
    });
  },
};
