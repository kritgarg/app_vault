const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const searchService = {
  globalSearch: async (query) => {
    if (!query || query.trim() === "") return [];
    
    const params = new URLSearchParams({ q: query.trim() });
    
    const res = await fetch(`${API_URL}/search?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch search results");
    }
    return res.json();
  },
};
