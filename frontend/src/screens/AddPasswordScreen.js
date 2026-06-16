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
import { useCreatePassword, useUpdatePassword, usePasswordDetails } from "../hooks/usePasswords";
import PasswordGenerator from "../components/PasswordGenerator";

const CATEGORIES = [
  "Banking", "Social", "Shopping", "Work", "Entertainment", "WiFi", "Other"
];

export default function AddPasswordScreen({ route, navigation }) {
  const isEditing = route.params?.id;
  const passwordId = route.params?.id;

  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("Other");
  const [notes, setNotes] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);

  const createMutation = useCreatePassword();
  const updateMutation = useUpdatePassword();
  
  const { data: existingPassword, isLoading: isLoadingDetails } = usePasswordDetails(passwordId);

  useEffect(() => {
    if (isEditing && existingPassword) {
      setTitle(existingPassword.title || "");
      setUsername(existingPassword.username || "");
      setWebsite(existingPassword.website || "");
      setCategory(existingPassword.category || "Other");
      // Note: We don't fetch the unencrypted password/notes here by default. 
      // If user wants to update password, they enter a new one. 
      // Or we could fetch it, but usually editing just leaves the password blank meaning "don't update".
    }
  }, [existingPassword, isEditing]);

  const handleSave = () => {
    if (!title) {
      Alert.alert("Validation Error", "Please provide a title.");
      return;
    }

    if (!isEditing && !password) {
      Alert.alert("Validation Error", "Please provide a password.");
      return;
    }

    const payload = {
      title,
      username,
      website,
      category,
      notes,
    };

    if (password) {
      payload.password = password;
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: passwordId, data: payload },
        {
          onSuccess: () => {
            Alert.alert("Success", "Password updated successfully!");
            navigation.goBack();
          },
          onError: (error) => {
            Alert.alert("Error", error.message || "Failed to update password.");
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          Alert.alert("Success", "Password saved to vault successfully!");
          navigation.goBack();
        },
        onError: (error) => {
          Alert.alert("Error", error.message || "Failed to save password.");
        },
      });
    }
  };

  if (isEditing && isLoadingDetails) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00b37e" />
      </View>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? "Edit Password" : "Add Password"}</Text>
          <Text style={styles.subtitle}>Store credentials securely</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Netflix, Gmail"
            placeholderTextColor="#5b5b66"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Username / Email</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. user@example.com"
            placeholderTextColor="#5b5b66"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Password {isEditing ? "(Leave blank to keep existing)" : "*"}</Text>
            <TouchableOpacity onPress={() => setShowGenerator(!showGenerator)}>
              <Text style={styles.generatorToggleText}>
                {showGenerator ? "Hide Generator" : "Generate"}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#5b5b66"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {showGenerator && (
            <PasswordGenerator 
              onGenerate={(pwd) => {
                setPassword(pwd);
                setShowGenerator(false);
              }} 
            />
          )}

          <Text style={styles.label}>Website URL</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. https://netflix.com"
            placeholderTextColor="#5b5b66"
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryBadge, category === cat && styles.categoryBadgeActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Security questions, PIN..."
            placeholderTextColor="#5b5b66"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.button, isPending && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{isEditing ? "Save Changes" : "Save Password"}</Text>
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
  center: {
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#c4c4cc",
    marginTop: 16,
    marginBottom: 8,
  },
  generatorToggleText: {
    color: "#00b37e",
    fontSize: 14,
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
  categoryScroll: {
    flexDirection: "row",
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: "#121214",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#29292e",
    marginRight: 8,
  },
  categoryBadgeActive: {
    backgroundColor: "#00b37e",
    borderColor: "#00b37e",
  },
  categoryText: {
    color: "#8d8d99",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#ffffff",
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
