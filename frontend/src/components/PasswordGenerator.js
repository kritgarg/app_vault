import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput } from "react-native";

export default function PasswordGenerator({ onGenerate }) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);

  const generatePassword = () => {
    let charset = "";
    if (uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) charset += "0123456789";
    if (symbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    if (charset === "") return "";

    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    // Ensure at least one of each selected type
    let finalPassword = password.split("");
    let positions = [];
    for (let i = 0; i < length; i++) positions.push(i);

    // simple shuffle for positions
    positions = positions.sort(() => Math.random() - 0.5);

    if (uppercase && positions.length > 0) {
      finalPassword[positions.pop()] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    }
    if (lowercase && positions.length > 0) {
      finalPassword[positions.pop()] = "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    }
    if (numbers && positions.length > 0) {
      finalPassword[positions.pop()] = "0123456789"[Math.floor(Math.random() * 10)];
    }
    if (symbols && positions.length > 0) {
      const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
      finalPassword[positions.pop()] = syms[Math.floor(Math.random() * syms.length)];
    }

    const result = finalPassword.join("");
    onGenerate(result);
  };

  const decreaseLength = () => setLength((prev) => Math.max(8, prev - 1));
  const increaseLength = () => setLength((prev) => Math.min(64, prev + 1));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Password Generator</Text>
      
      <View style={styles.lengthContainer}>
        <Text style={styles.label}>Length: {length}</Text>
        <View style={styles.counter}>
          <TouchableOpacity onPress={decreaseLength} style={styles.counterBtn}>
            <Text style={styles.counterText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.lengthText}>{length}</Text>
          <TouchableOpacity onPress={increaseLength} style={styles.counterBtn}>
            <Text style={styles.counterText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Uppercase (A-Z)</Text>
        <Switch value={uppercase} onValueChange={setUppercase} trackColor={{ true: "#00b37e" }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Lowercase (a-z)</Text>
        <Switch value={lowercase} onValueChange={setLowercase} trackColor={{ true: "#00b37e" }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Numbers (0-9)</Text>
        <Switch value={numbers} onValueChange={setNumbers} trackColor={{ true: "#00b37e" }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Symbols (!@#$)</Text>
        <Switch value={symbols} onValueChange={setSymbols} trackColor={{ true: "#00b37e" }} />
      </View>

      <TouchableOpacity
        style={[styles.button, (!uppercase && !lowercase && !numbers && !symbols) && styles.buttonDisabled]}
        onPress={generatePassword}
        disabled={!uppercase && !lowercase && !numbers && !symbols}
      >
        <Text style={styles.buttonText}>Generate & Autofill</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1c1c21",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    marginTop: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#29292e",
  },
  lengthContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#29292e",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterBtn: {
    backgroundColor: "#29292e",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  counterText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: -2,
  },
  lengthText: {
    color: "#ffffff",
    fontSize: 16,
    marginHorizontal: 16,
    fontWeight: "bold",
  },
  label: {
    color: "#c4c4cc",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#00b37e",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
