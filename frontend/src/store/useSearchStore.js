import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useSearchStore = create(
  persist(
    (set) => ({
      recentSearches: [],
      addRecentSearch: (query) => set((state) => {
        const trimmed = query.trim();
        if (!trimmed) return state;
        
        // Remove existing to bring to top
        const filtered = state.recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
        
        return {
          recentSearches: [trimmed, ...filtered].slice(0, 10) // Keep top 10
        };
      }),
      removeRecentSearch: (query) => set((state) => ({
        recentSearches: state.recentSearches.filter((item) => item.toLowerCase() !== query.toLowerCase())
      })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "vault-search-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
