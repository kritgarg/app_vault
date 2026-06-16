import { create } from "zustand";

export const useVaultStore = create((set) => ({
  // The current lock state of the vault.
  // Defaults to false to ensure a "closed-by-default" security model on launch.
  isVaultUnlocked: false,

  // Indicates whether a 6-digit PIN has been enrolled in SecureStore.
  hasPin: false,

  // Action: Unlocks the vault UI, allowing access to the main dashboard.
  unlockVault: () => set({ isVaultUnlocked: true }),

  // Action: Locks the vault UI immediately, hiding card details.
  lockVault: () => set({ isVaultUnlocked: false }),

  // Action: Updates the PIN enrollment state (e.g. true if PIN is created/verified, false otherwise).
  setHasPin: (hasPin) => set({ hasPin }),

  // Prevents auto-lock when a native file picker is open
  isPickingFile: false,
  setIsPickingFile: (isPickingFile) => set({ isPickingFile }),

  // Prevents auto-lock when the camera scanner is open
  isScanningCard: false,
  setIsScanningCard: (isScanningCard) => set({ isScanningCard }),
}));
