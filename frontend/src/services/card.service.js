const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const cardService = {
  // Fetch all cards for the active authenticated user
  getCards: async () => {
    const res = await fetch(`${API_URL}/cards`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Essential in React Native to forward session cookies
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch cards");
    }
    return res.json();
  },

  // Fetch a specific card by its UUID
  getCardById: async (id) => {
    const res = await fetch(`${API_URL}/cards/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch card details");
    }
    return res.json();
  },

  // Create a new card
  createCard: async (cardData) => {
    const res = await fetch(`${API_URL}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cardData),
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create card");
    }
    return res.json();
  },

  // Delete a card
  deleteCard: async (id) => {
    const res = await fetch(`${API_URL}/cards/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete card");
    }
    return res.json();
  },

  // Reveal raw card number and CVV by passing biometric authentication flag
  revealCard: async (id) => {
    const res = await fetch(`${API_URL}/cards/${id}/reveal`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-vault-authenticated": "true",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to reveal card credentials");
    }
    return res.json();
  },

  // Query BIN details for auto detection
  lookupBIN: async (bin) => {
    const res = await fetch(`${API_URL}/cards/bin/${bin}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to perform BIN lookup");
    }
    return res.json();
  },
};
