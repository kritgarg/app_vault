import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { useVaultStore } from "../store/useVaultStore";
import { useBiometrics } from "../hooks/useBiometrics";

const PIN_KEY = "vault_pin_hash";

export default function PINScreen() {
  const { hasPin, setHasPin, unlockVault } = useVaultStore();
  const { isCompatible, isEnrolled, authenticate, loading: loadingBiometrics } = useBiometrics();

  // Mode: 'verify' or 'create'
  const [mode, setMode] = useState(hasPin ? "verify" : "create");
  
  // Setup steps: 1 (enter new PIN), 2 (confirm PIN)
  const [setupStep, setSetupStep] = useState(1);
  const [tempPin, setTempPin] = useState("");
  
  const [enteredDigits, setEnteredDigits] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Auto-trigger biometrics on load if in verify mode
  useEffect(() => {
    let active = true;
    if (mode === "verify" && isCompatible && isEnrolled && !loadingBiometrics) {
      // Small timeout to allow screen transition to complete smoothly
      const timer = setTimeout(async () => {
        if (active) {
          const success = await authenticate();
          if (success) {
            unlockVault();
          }
        }
      }, 350);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [mode, isCompatible, isEnrolled, loadingBiometrics, authenticate, unlockVault]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  // Performs SHA-256 cryptographic hashing of the entered PIN
  const hashPIN = async (pin) => {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );
      return hash;
    } catch (error) {
      console.error("Failed to hash PIN:", error);
      throw error;
    }
  };

  const handlePINComplete = useCallback(async (pin) => {
    if (mode === "verify") {
      try {
        const storedHash = await SecureStore.getItemAsync(PIN_KEY);
        const enteredHash = await hashPIN(pin);

        if (storedHash === enteredHash) {
          setErrorMsg("");
          setAttempts(0);
          unlockVault();
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setEnteredDigits("");
          
          if (newAttempts >= 5) {
            setLockoutTime(30); // 30 seconds lockout after 5 failures
            setErrorMsg("Too many incorrect attempts. Locked for 30s.");
          } else {
            setErrorMsg(`Incorrect PIN. ${5 - newAttempts} attempts remaining.`);
          }
        }
      } catch (error) {
        Alert.alert("Error", "Failed to access secure key storage.");
      }
    } else {
      // Create PIN Mode
      if (setupStep === 1) {
        setTempPin(pin);
        setSetupStep(2);
        setEnteredDigits("");
        setErrorMsg("");
      } else {
        // Confirm PIN
        if (pin === tempPin) {
          try {
            const hash = await hashPIN(pin);
            await SecureStore.setItemAsync(PIN_KEY, hash);
            setHasPin(true);
            setErrorMsg("");
            unlockVault();
          } catch (error) {
            Alert.alert("Error", "Could not save PIN securely.");
          }
        } else {
          setErrorMsg("PINs do not match. Restarting setup.");
          setSetupStep(1);
          setTempPin("");
          setEnteredDigits("");
        }
      }
    }
  }, [mode, setupStep, tempPin, attempts, unlockVault, setHasPin]);

  const handleKeyPress = (num) => {
    if (lockoutTime > 0) return;
    if (errorMsg) setErrorMsg("");

    const updated = enteredDigits + num;
    if (updated.length <= 6) {
      setEnteredDigits(updated);
      if (updated.length === 6) {
        // Use a short delay so the 6th dot displays as filled before executing check
        setTimeout(() => {
          handlePINComplete(updated);
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    if (lockoutTime > 0) return;
    if (enteredDigits.length > 0) {
      setEnteredDigits(enteredDigits.slice(0, -1));
    }
  };

  const handleBiometricPress = async () => {
    if (lockoutTime > 0) return;
    if (mode === "verify" && isCompatible && isEnrolled) {
      const success = await authenticate();
      if (success) {
        unlockVault();
      }
    } else {
      Alert.alert("Notice", "Biometrics not available or PIN not set up.");
    }
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 1; i <= 6; i++) {
      const isFilled = enteredDigits.length >= i;
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            isFilled ? styles.dotFilled : styles.dotEmpty,
            errorMsg ? styles.dotError : null,
          ]}
        />
      );
    }
    return dots;
  };

  const getInstructions = () => {
    if (lockoutTime > 0) {
      return `Locked out. Please wait ${lockoutTime}s...`;
    }
    if (mode === "verify") {
      return "Enter your 6-digit Vault PIN";
    }
    return setupStep === 1
      ? "Create a 6-digit Vault PIN"
      : "Confirm your 6-digit Vault PIN";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>FamilyVault</Text>
        <Text style={styles.securityText}>🔒 Vault Security Gate</Text>
        <Text style={[styles.instructionText, lockoutTime > 0 ? styles.errorText : null]}>
          {getInstructions()}
        </Text>
      </View>

      <View style={styles.dotsContainer}>{renderDots()}</View>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <View style={styles.keypad}>
        <View style={styles.row}>
          {[1, 2, 3].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.key}
              onPress={() => handleKeyPress(num.toString())}
              disabled={lockoutTime > 0}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          {[4, 5, 6].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.key}
              onPress={() => handleKeyPress(num.toString())}
              disabled={lockoutTime > 0}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          {[7, 8, 9].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.key}
              onPress={() => handleKeyPress(num.toString())}
              disabled={lockoutTime > 0}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.key, styles.utilityKey]}
            onPress={handleBiometricPress}
            disabled={lockoutTime > 0 || mode !== "verify" || !isEnrolled}
          >
            {isCompatible && isEnrolled ? (
              <Text style={[styles.keyText, styles.biometricIconText]}>🧬</Text>
            ) : (
              <View />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.key}
            onPress={() => handleKeyPress("0")}
            disabled={lockoutTime > 0}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.key, styles.utilityKey]}
            onPress={handleDelete}
            disabled={lockoutTime > 0}
          >
            <Text style={styles.keyText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121214",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#00b37e",
    letterSpacing: 1,
  },
  securityText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8d8d99",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  instructionText: {
    fontSize: 16,
    color: "#ffffff",
    marginTop: 24,
    textAlign: "center",
    fontWeight: "500",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    marginVertical: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  dotEmpty: {
    borderColor: "#29292e",
    backgroundColor: "transparent",
  },
  dotFilled: {
    borderColor: "#00b37e",
    backgroundColor: "#00b37e",
  },
  dotError: {
    borderColor: "#f75a68",
    backgroundColor: "#f75a68",
  },
  errorText: {
    color: "#f75a68",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 20,
  },
  keypad: {
    width: "100%",
    maxHeight: 380,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#1c1c21",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#29292e",
  },
  utilityKey: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  keyText: {
    fontSize: 26,
    color: "#ffffff",
    fontWeight: "600",
  },
  biometricIconText: {
    fontSize: 28,
  },
});
