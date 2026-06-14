import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAuthStore } from "../store/useAuthStore";
import { authClient } from "../../lib/auth-client";
import { useVaultStore } from "../store/useVaultStore";
import * as SecureStore from "expo-secure-store";

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const { lockVault, setHasPin } = useVaultStore();
  const [loadingAction, setLoadingAction] = useState(null); // 'verify', 'forget', 'signout'

  const handleLockVault = () => {
    lockVault();
  };

  const handleResetPIN = () => {
    Alert.alert(
      "Reset Vault PIN",
      "Are you sure you want to reset your vault security PIN? You will be locked out and prompted to create a new one immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync("vault_pin_hash");
              setHasPin(false);
              lockVault();
            } catch (error) {
              console.error("Failed to delete PIN:", error);
              Alert.alert("Error", "Could not delete existing PIN.");
            }
          },
        },
      ]
    );
  };

  const handleSendVerification = async () => {
    setLoadingAction("verify");
    try {
      const response = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: `${process.env.EXPO_PUBLIC_API_URL}/api/auth/verify-email`, // Default verification callback
      });

      if (response && response.error) {
        Alert.alert("Error", response.error.message || "Failed to send verification email");
      } else {
        Alert.alert("Success", "Verification email sent! Please check your inbox.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to send verification email. Try again later.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleForgetPassword = async () => {
    setLoadingAction("forget");
    try {
      const response = await authClient.forgetPassword({
        email: user.email,
        redirectTo: `${process.env.EXPO_PUBLIC_API_URL}/api/auth/reset-password`,
      });

      if (response && response.error) {
        Alert.alert("Error", response.error.message || "Failed to send password reset link");
      } else {
        Alert.alert("Success", "Password reset link sent! Please check your inbox.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to process request. Try again later.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSignOut = async () => {
    setLoadingAction("signout");
    try {
      await authClient.signOut();
      clearAuth(); // Wipes local store user/session state, triggering redirect
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>Secure vault user status</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{user.name || "N/A"}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email Status</Text>
          <Text
            style={[
              styles.infoValue,
              user.emailVerified ? styles.statusVerified : styles.statusUnverified,
            ]}
          >
            {user.emailVerified ? "Verified" : "Unverified"}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {!user.emailVerified && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendVerification}
            disabled={loadingAction !== null}
          >
            {loadingAction === "verify" ? (
              <ActivityIndicator color="#00b37e" />
            ) : (
              <Text style={styles.actionButtonText}>Verify Email Address</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleForgetPassword}
          disabled={loadingAction !== null}
        >
          {loadingAction === "forget" ? (
            <ActivityIndicator color="#00b37e" />
          ) : (
            <Text style={styles.actionButtonText}>Reset/Forget Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLockVault}
          disabled={loadingAction !== null}
        >
          <Text style={styles.actionButtonText}>🔒 Lock Vault Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleResetPIN}
          disabled={loadingAction !== null}
        >
          <Text style={styles.actionButtonText}>⚙️ Reset Vault PIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.signOutButton]}
          onPress={handleSignOut}
          disabled={loadingAction !== null}
        >
          {loadingAction === "signout" ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121214",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 14,
    color: "#8d8d99",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 16,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#8d8d99",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  statusVerified: {
    color: "#00b37e",
    fontWeight: "bold",
  },
  statusUnverified: {
    color: "#f75a68",
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#29292e",
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#1c1c21",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#29292e",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#00b37e",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#f75a68",
    borderColor: "#f75a68",
    marginTop: 12,
  },
  signOutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
