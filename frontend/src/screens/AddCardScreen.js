import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useCreateCard } from "../hooks/useCreateCard";
import { useBinLookup } from "../hooks/useBinLookup";

export default function AddCardScreen({ navigation }) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [notes, setNotes] = useState("");
  
  // New detected metadata properties
  const [bankName, setBankName] = useState("");
  const [network, setNetwork] = useState("");
  const [cardType, setCardType] = useState("");

  const createCardMutation = useCreateCard();
  
  // Trigger debounced query for BIN metadata
  const { data: binData, isFetching: isBinFetching } = useBinLookup(cardNumber);

  // Auto-fill form values when BIN data is resolved
  useEffect(() => {
    if (binData && binData.success) {
      setBank(binData.bankName);
      setBankName(binData.bankName);
      setNetwork(binData.network);
      setCardType(binData.cardType);
    }
  }, [binData]);

  const handleSave = () => {
    if (!name || !bank || !cardNumber || !expiry || !cvv) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return;
    }

    createCardMutation.mutate(
      { 
        name, 
        bank, 
        cardNumber, 
        expiry, 
        cvv,
        bankName: bankName || bank, // Fallback to user custom input if API is down
        network: network || "Unknown",
        cardType: cardType || "Credit",
        notes: notes || null,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Card saved to vault successfully!");
          navigation.goBack();
        },
        onError: (error) => {
          Alert.alert("Error", error.message || "Failed to save card. Please try again.");
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Add Card</Text>
          <Text style={styles.subtitle}>Enter credit or debit card details</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Card Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Personal Credit Card"
            placeholderTextColor="#5b5b66"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. HDFC"
            placeholderTextColor="#5b5b66"
            value={bank}
            onChangeText={setBank}
            autoCapitalize="characters"
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Card Number</Text>
            {isBinFetching ? (
              <ActivityIndicator size="small" color="#00b37e" style={styles.loader} />
            ) : null}
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. 4111 2222 3333 4444"
            placeholderTextColor="#5b5b66"
            value={cardNumber}
            onChangeText={(txt) => {
              setCardNumber(txt);
              if (txt.length < 6) {
                // Clear state if user deletes the BIN prefix
                setBankName("");
                setNetwork("");
                setCardType("");
              }
            }}
            keyboardType="number-pad"
            maxLength={19}
          />

          {network || cardType ? (
            <View style={styles.metaBadgeContainer}>
              {network ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>💳 {network}</Text>
                </View>
              ) : null}
              {cardType ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🏷️ {cardType}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor="#5b5b66"
                value={expiry}
                onChangeText={setExpiry}
                maxLength={5}
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 123"
                placeholderTextColor="#5b5b66"
                value={cvv}
                onChangeText={setCvv}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Support contact, billing address, PIN fallback..."
            placeholderTextColor="#5b5b66"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.button, createCardMutation.isPending && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={createCardMutation.isPending}
          >
            {createCardMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Save Card</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121214",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 28,
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
  form: {
    backgroundColor: "#1c1c21",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#c4c4cc",
  },
  loader: {
    alignSelf: "center",
  },
  metaBadgeContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  badge: {
    backgroundColor: "#121214",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#29292e",
  },
  badgeText: {
    color: "#00b37e",
    fontSize: 13,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#121214",
    color: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#29292e",
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  rowItem: {
    flex: 1,
  },
  button: {
    backgroundColor: "#00b37e",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
