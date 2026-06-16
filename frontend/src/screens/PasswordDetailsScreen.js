import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { usePasswordDetails, useDeletePassword, useRevealPassword, useUpdatePassword } from "../hooks/usePasswords";
import { useBiometrics } from "../hooks/useBiometrics";
import Toast from "../components/Toast";

export default function PasswordDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { data: password, isLoading, error } = usePasswordDetails(id);
  const deleteMutation = useDeletePassword();
  const revealMutation = useRevealPassword();
  const updateMutation = useUpdatePassword();
  const { authenticate, isSupported } = useBiometrics();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [revealedPassword, setRevealedPassword] = useState(null);
  const [revealedNotes, setRevealedNotes] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  useEffect(() => {
    let timeout;
    if (isRevealed) {
      timeout = setTimeout(() => {
        setIsRevealed(false);
        setRevealedPassword(null);
        setRevealedNotes(null);
        showToast("Password auto-hidden");
      }, 30000); // 30 seconds
    }
    return () => clearTimeout(timeout);
  }, [isRevealed]);

  const handleReveal = async () => {
    if (isRevealed) {
      // Hide manually
      setIsRevealed(false);
      setRevealedPassword(null);
      setRevealedNotes(null);
      return;
    }

    if (isSupported) {
      const authResult = await authenticate("Verify your identity to reveal password");
      if (!authResult.success) {
        Alert.alert("Authentication Failed", authResult.error || "Could not verify identity");
        return;
      }
    }

    revealMutation.mutate(id, {
      onSuccess: (data) => {
        setRevealedPassword(data.password);
        setRevealedNotes(data.notes);
        setIsRevealed(true);
      },
      onError: (err) => {
        Alert.alert("Error", err.message || "Failed to reveal password");
      },
    });
  };

  const copyToClipboard = async (text, label) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    showToast(`${label} copied to clipboard`);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Password",
      "Are you sure you want to remove this password from your vault? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(id, {
              onSuccess: () => {
                navigation.goBack();
              },
            });
          },
        },
      ]
    );
  };

  const handleToggleFavorite = () => {
    updateMutation.mutate({
      id: password.id,
      data: { favorite: !password.favorite }
    }, {
      onSuccess: () => {
        showToast(password.favorite ? "Removed from Favorites" : "Added to Favorites");
      },
      onError: () => {
        Alert.alert("Error", "Failed to update favorite status");
      }
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#00b37e" />
      </View>
    );
  }

  if (error || !password) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Failed to load password details</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{password.title}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{password.category}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={updateMutation.isPending}
          >
            <Text style={styles.favoriteIcon}>{password.favorite ? "⭐" : "☆"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Username / Email</Text>
          <View style={styles.row}>
            <Text style={styles.value}>{password.username || "N/A"}</Text>
            {password.username && (
              <TouchableOpacity onPress={() => copyToClipboard(password.username, "Username")}>
                <Text style={styles.actionText}>Copy</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Website</Text>
          <Text style={styles.value}>{password.website || "N/A"}</Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={handleReveal} disabled={revealMutation.isPending}>
              {revealMutation.isPending ? (
                <ActivityIndicator size="small" color="#00b37e" />
              ) : (
                <Text style={styles.actionText}>{isRevealed ? "Hide" : "Reveal"}</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <Text style={styles.secretValue}>
              {isRevealed ? revealedPassword : "••••••••••••••••"}
            </Text>
            {isRevealed && (
              <TouchableOpacity onPress={() => copyToClipboard(revealedPassword, "Password")}>
                <Text style={styles.actionText}>Copy</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>
            {isRevealed ? (revealedNotes || "No notes") : (password.encryptedNotes ? "•••••••• (Hidden)" : "No notes")}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("AddPassword", { id })}
          >
            <Text style={styles.editButtonText}>Edit Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            <Text style={styles.deleteButtonText}>Delete Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        onHide={() => setToastVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121214",
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 12,
  },
  favoriteIcon: {
    fontSize: 28,
    color: "#ffffff",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    backgroundColor: "#1c1c21",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#29292e",
  },
  badgeText: {
    color: "#00b37e",
    fontSize: 12,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 24,
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    color: "#8d8d99",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "bold",
  },
  value: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  secretValue: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#29292e",
    marginVertical: 20,
  },
  actionText: {
    color: "#00b37e",
    fontSize: 14,
    fontWeight: "bold",
  },
  actionsContainer: {
    gap: 16,
  },
  editButton: {
    backgroundColor: "#1c1c21",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00b37e",
  },
  editButtonText: {
    color: "#00b37e",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f75a68",
  },
  deleteButtonText: {
    color: "#f75a68",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#f75a68",
    fontSize: 16,
  },
});
