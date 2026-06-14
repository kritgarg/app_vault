import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  isLoading: true,

  // Set user information
  setUser: (user) => set({ user }),

  // Set active session details
  setSession: (session) => set({ session }),

  // Toggle loading state (useful for bootstrap/splash checks)
  setLoading: (isLoading) => set({ isLoading }),

  // Clear all authentication states (on logout or session expiration)
  clearAuth: () => set({ user: null, session: null, isLoading: false }),
}));
