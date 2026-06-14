import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useVaultStore } from "../store/useVaultStore";
import { useAppStateAutoLock } from "../hooks/useAppStateAutoLock";
import AppStack from "./AppStack";
import PINScreen from "../screens/PINScreen";

export default function VaultGate() {
  const { isVaultUnlocked, setHasPin } = useVaultStore();
  const [checkingPin, setCheckingPin] = useState(true);

  // Phase 5: Hook up AppState listener to automatically lock the app
  useAppStateAutoLock();

  // On mount, check if the user has enrolled a PIN previously
  useEffect(() => {
    async function checkPinEnrollment() {
      try {
        const storedHash = await SecureStore.getItemAsync("vault_pin_hash");
        setHasPin(!!storedHash);
      } catch (error) {
        console.error("Failed to check stored PIN hash:", error);
      } finally {
        setCheckingPin(false);
      }
    }

    checkPinEnrollment();
  }, [setHasPin]);

  // Prevent flash of PIN setup UI during SecureStore bootstrap read
  if (checkingPin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b37e" />
      </View>
    );
  }

  // Gatekeeping route selection
  if (!isVaultUnlocked) {
    return <PINScreen />;
  }

  return <AppStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#121214",
    alignItems: "center",
    justifyContent: "center",
  },
});
