import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useVaultStore } from "../store/useVaultStore";

export const useAppStateAutoLock = () => {
  const lockVault = useVaultStore((state) => state.lockVault);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Listens for application state transitions.
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // Transitioning from active to background (app minimized) or inactive (app switcher active / panel pulled down)
      // will trigger an automatic lock.
      if (
        appState.current === "active" &&
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        const { isPickingFile, isScanningCard } = useVaultStore.getState();
        if (!isPickingFile && !isScanningCard) {
          console.log(`AppState transition: active -> ${nextAppState}. Auto locking vault.`);
          lockVault();
        } else {
          console.log(`AppState transition: active -> ${nextAppState}. Ignored lock due to native picker/scanner.`);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [lockVault]);
};
