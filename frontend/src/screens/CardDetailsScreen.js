import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as Clipboard from "expo-clipboard";

import { useCardDetails, useRevealCard } from "../hooks/useCards";
import { useDeleteCard } from "../hooks/useDeleteCard";
import { useBiometrics } from "../hooks/useBiometrics";

import CardPreview from "../components/CardPreview";
import FlipCard from "../components/FlipCard";
import Toast from "../components/Toast";

export default function CardDetailsScreen({ route, navigation }) {
  const { id } = route.params;

  const { data: card, isLoading, error } = useCardDetails(id);
  const deleteMutation = useDeleteCard();
  const revealMutation = useRevealCard();
  const { isCompatible, isEnrolled, authenticate } = useBiometrics();

  // Secure reveal states
  const [isRevealed, setIsRevealed] = useState(false);
  const [plainCardNumber, setPlainCardNumber] = useState("");
  const [plainCvv, setPlainCvv] = useState("");

  // Auto-hide countdown timer states
  const [timeLeft, setTimeLeft] = useState(0);

  // Fallback PIN modal states
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Auto-hide countdown and trigger effect
  useEffect(() => {
    let interval;
    let timeout;

    if (isRevealed) {
      setTimeLeft(30); // Start 30 seconds countdown

      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timeout = setTimeout(() => {
        // Automatically hide details
        setIsRevealed(false);
        setPlainCardNumber("");
        setPlainCvv("");
        triggerToast("Details hidden automatically for security");
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [isRevealed]);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Card",
      "Are you sure you want to delete this card from your secure vault?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(id, {
              onSuccess: () => {
                Alert.alert("Success", "Card deleted successfully.");
                navigation.goBack();
              },
              onError: (error) => {
                Alert.alert("Error", error.message || "Failed to delete card.");
              },
            });
          },
        },
      ]
    );
  };

  const handleRevealToggle = async () => {
    if (isRevealed) {
      // Toggle off manually -> re-mask immediately
      setIsRevealed(false);
      setPlainCardNumber("");
      setPlainCvv("");
      setTimeLeft(0);
      return;
    }

    // Attempt Biometric authentication
    if (isCompatible && isEnrolled) {
      try {
        const success = await authenticate();
        if (success) {
          fetchDecryptedDetails();
          return;
        }
      } catch (err) {
        console.warn("Biometric verification error:", err);
      }
    }

    // Fall back to PIN Modal if biometrics are unavailable or failed
    setPinError("");
    setEnteredPin("");
    setPinModalVisible(true);
  };

  const fetchDecryptedDetails = () => {
    revealMutation.mutate(id, {
      onSuccess: (data) => {
        setPlainCardNumber(data.cardNumber);
        setPlainCvv(data.cvv);
        setIsRevealed(true);
      },
      onError: (err) => {
        Alert.alert("Error", err.message || "Failed to decrypt card details.");
      },
    });
  };

  const handleVerifyPin = async () => {
    if (enteredPin.length !== 6) {
      setPinError("PIN must be exactly 6 digits.");
      return;
    }

    try {
      const storedHash = await SecureStore.getItemAsync("vault_pin_hash");
      const enteredHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        enteredPin
      );

      if (storedHash === enteredHash) {
        setPinModalVisible(false);
        setPinError("");
        setEnteredPin("");
        fetchDecryptedDetails();
      } else {
        setPinError("Incorrect PIN. Please try again.");
        setEnteredPin("");
      }
    } catch (err) {
      console.error(err);
      setPinError("Failed to access secure store.");
    }
  };

  // Clipboard copy functions
  const handleCopyCardNumber = async () => {
    if (!isRevealed) {
      // Prompt verification before copy if masked
      Alert.alert("Security Check", "Please reveal details before copying card numbers.");
      return;
    }
    await Clipboard.setStringAsync(plainCardNumber);
    triggerToast("Card Number copied to clipboard");
  };

  const handleCopyCVV = async () => {
    if (!isRevealed) {
      Alert.alert("Security Check", "Please reveal details before copying CVV.");
      return;
    }
    await Clipboard.setStringAsync(plainCvv);
    triggerToast("CVV copied to clipboard");
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00b37e" />
      </View>
    );
  }

  if (error || !card) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error?.message || "Card not found"}</Text>
      </View>
    );
  }

  // Define front and back card layouts for FlipCard component
  const cardFront = (
    <CardPreview
      name={card.name}
      bank={card.bankName || card.bank}
      cardNumber={isRevealed ? plainCardNumber : card.cardNumber}
      expiry={card.expiry}
      cvv={isRevealed ? plainCvv : "•••"}
      network={card.network}
      cardType={card.cardType}
      isBack={false}
    />
  );

  const cardBack = (
    <CardPreview
      name={card.name}
      bank={card.bankName || card.bank}
      cardNumber={isRevealed ? plainCardNumber : card.cardNumber}
      expiry={card.expiry}
      cvv={isRevealed ? plainCvv : "•••"}
      network={card.network}
      cardType={card.cardType}
      notes={card.notes}
      isBack={true}
    />
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Card details</Text>
          <Text style={styles.subtitle}>🔒 Decryption protected by vault security</Text>
        </View>

        {/* 3D Flip Card Rendering */}
        <View style={styles.flipCardSection}>
          <FlipCard frontComponent={cardFront} backComponent={cardBack} />
          <Text style={styles.flipTipText}>🔄 Tap card to flip and view notes</Text>
        </View>

        {/* Security Auto-Hide Banner */}
        {isRevealed && (
          <View style={styles.timerBanner}>
            <Text style={styles.timerBannerText}>
              ⏳ Sensitive fields revealed. Auto-hiding in {timeLeft} seconds.
            </Text>
          </View>
        )}

        {/* Card info display card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardSectionTitle}>Card Parameters</Text>
          
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>Card Name</Text>
              <Text style={styles.infoValue}>{card.name}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>Issuing Bank</Text>
              <Text style={styles.infoValue}>
                {card.bankName ? `${card.bankName} (${card.bank})` : card.bank}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.textContainer}>
              <Text style={styles.infoLabel}>Card Number</Text>
              <Text style={[styles.infoValue, isRevealed ? styles.revealedText : null]}>
                {isRevealed ? plainCardNumber : card.cardNumber}
              </Text>
            </View>
            {isRevealed && (
              <TouchableOpacity style={styles.copyBadge} onPress={handleCopyCardNumber}>
                <Text style={styles.copyBadgeText}>Copy</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>Expiry Date</Text>
              <Text style={styles.infoValue}>{card.expiry}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.textContainer}>
              <Text style={styles.infoLabel}>CVV</Text>
              <Text style={[styles.infoValue, isRevealed ? styles.revealedText : null]}>
                {isRevealed ? plainCvv : "•••"}
              </Text>
            </View>
            {isRevealed && (
              <TouchableOpacity style={styles.copyBadge} onPress={handleCopyCVV}>
                <Text style={styles.copyBadgeText}>Copy</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notes display card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardSectionTitle}>Card Notes</Text>
          <Text style={styles.notesText}>
            {card.notes || "No custom notes entered for this card. Tap 'Edit' in a future update to add billing details or PIN fallbacks."}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.revealButton,
              isRevealed ? styles.revealButtonActive : null,
              revealMutation.isPending ? styles.buttonDisabled : null,
            ]}
            onPress={handleRevealToggle}
            disabled={revealMutation.isPending}
          >
            {revealMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.revealButtonText}>
                {isRevealed ? "🔒 Hide Details" : "👁️ Reveal Sensitive Data"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, deleteMutation.isPending && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={deleteMutation.isPending || revealMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Card</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fallback 6-digit PIN Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={pinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Vault PIN</Text>
            <Text style={styles.modalSubtitle}>
              Confirm your 6-digit security PIN to reveal credentials.
            </Text>

            <TextInput
              style={styles.pinInput}
              placeholder="XXXXXX"
              placeholderTextColor="#5b5b66"
              value={enteredPin}
              onChangeText={(txt) => {
                setEnteredPin(txt.replace(/\D/g, "").slice(0, 6));
                if (pinError) setPinError("");
              }}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoFocus
            />

            {pinError ? <Text style={styles.pinErrorText}>{pinError}</Text> : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleVerifyPin}
              >
                <Text style={styles.modalConfirmButtonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Toast Alert */}
      <Toast
        message={toastMsg}
        visible={toastVisible}
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
  scrollContainer: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
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
    fontWeight: "600",
  },
  flipCardSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  flipTipText: {
    color: "#8d8d99",
    fontSize: 12,
    marginTop: 10,
    fontWeight: "600",
  },
  timerBanner: {
    backgroundColor: "rgba(247, 90, 104, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(247, 90, 104, 0.3)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  timerBannerText: {
    color: "#f75a68",
    fontSize: 13,
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 20,
    marginBottom: 20,
  },
  infoCardSectionTitle: {
    color: "#c4c4cc",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#8d8d99",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
  },
  revealedText: {
    color: "#00b37e",
  },
  divider: {
    height: 1,
    backgroundColor: "#29292e",
  },
  notesText: {
    color: "#e1e1e6",
    fontSize: 14,
    lineHeight: 20,
  },
  copyBadge: {
    backgroundColor: "#121214",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#29292e",
  },
  copyBadgeText: {
    color: "#00b37e",
    fontSize: 12,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121214",
  },
  errorText: {
    color: "#f75a68",
    fontSize: 16,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  revealButton: {
    backgroundColor: "#00b37e",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  revealButtonActive: {
    backgroundColor: "#29292e",
    borderWidth: 1,
    borderColor: "#00b37e",
  },
  revealButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#1c1c21",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f75a68",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: "#f75a68",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Modal fallback Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#8d8d99",
    textAlign: "center",
    marginBottom: 20,
  },
  pinInput: {
    backgroundColor: "#121214",
    color: "#ffffff",
    width: "60%",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#29292e",
    marginBottom: 16,
  },
  pinErrorText: {
    color: "#f75a68",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#29292e",
  },
  modalCancelButtonText: {
    color: "#8d8d99",
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButton: {
    backgroundColor: "#00b37e",
  },
  modalConfirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
