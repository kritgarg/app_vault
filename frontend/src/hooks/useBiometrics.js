import { useState, useEffect, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { useVaultStore } from "../store/useVaultStore";

export const useBiometrics = () => {
  const [isCompatible, setIsCompatible] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const unlockVault = useVaultStore((state) => state.unlockVault);

  // Checks device hardware compatibility and user enrollment on mount
  useEffect(() => {
    const checkCompatibility = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        setIsCompatible(hasHardware);

        if (hasHardware) {
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          setIsEnrolled(enrolled);
        }
      } catch (error) {
        console.error("Error checking biometric compatibility:", error);
      } finally {
        setLoading(false);
      }
    };

    checkCompatibility();
  }, []);

  // Prompts user with Face ID / Fingerprint.
  // Returns true on success, false on failure (which triggers PIN screen navigation).
  const authenticate = useCallback(async () => {
    if (!isCompatible || !isEnrolled) {
      console.warn("Biometrics not available or not enrolled.");
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock FamilyVault",
        fallbackLabel: "Use PIN", // Displays on iOS when prompt fails
        cancelLabel: "Cancel",
        disableDeviceFallback: true, // Force PIN screen custom navigation rather than OS default fallback if desired
      });

      if (result.success) {
        unlockVault();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Biometric authentication error:", error);
      return false;
    }
  }, [isCompatible, isEnrolled, unlockVault]);

  return {
    isCompatible,
    isEnrolled,
    loading,
    authenticate,
  };
};
