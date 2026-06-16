const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const documentService = {
  getDocuments: async () => {
    const res = await fetch(`${API_URL}/documents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch documents");
    }
    return res.json();
  },

  getDocument: async (id) => {
    const res = await fetch(`${API_URL}/documents/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch document details");
    }
    return res.json();
  },

  uploadDocument: async (fileObj, metadata) => {
    // Construct FormData
    const formData = new FormData();
    
    formData.append("title", metadata.title);
    if (metadata.category) {
      formData.append("category", metadata.category);
    }
    if (metadata.expiryDate) {
      formData.append("expiryDate", metadata.expiryDate);
    }

    formData.append("file", {
      uri: fileObj.uri,
      name: fileObj.name,
      type: fileObj.mimeType || "application/octet-stream",
    });

    const res = await fetch(`${API_URL}/documents/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
      // Note: Don't set Content-Type header manually when sending FormData
      // The browser/React Native will automatically set it to multipart/form-data with the correct boundary
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to upload document");
    }
    return res.json();
  },

  deleteDocument: async (id) => {
    const res = await fetch(`${API_URL}/documents/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete document");
    }
    return res.json();
  },

  toggleFavorite: async (id) => {
    const res = await fetch(`${API_URL}/documents/${id}/favorite`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to toggle favorite");
    }
    return res.json();
  },
};
