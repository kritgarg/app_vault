const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const passwordService = {
  getPasswords: async () => {
    const res = await fetch(`${API_URL}/passwords`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch passwords");
    }
    return res.json();
  },

  getPasswordById: async (id) => {
    const res = await fetch(`${API_URL}/passwords/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch password details");
    }
    return res.json();
  },

  createPassword: async (passwordData) => {
    const res = await fetch(`${API_URL}/passwords`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(passwordData),
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create password");
    }
    return res.json();
  },

  updatePassword: async ({ id, data }) => {
    const res = await fetch(`${API_URL}/passwords/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update password");
    }
    return res.json();
  },

  deletePassword: async (id) => {
    const res = await fetch(`${API_URL}/passwords/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete password");
    }
    return res.json();
  },

  revealPassword: async (id) => {
    const res = await fetch(`${API_URL}/passwords/${id}/reveal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vault-authenticated": "true",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to reveal password");
    }
    return res.json();
  },
};
