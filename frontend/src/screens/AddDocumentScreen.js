import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useUploadDocument } from "../hooks/useDocuments";
import { useVaultStore } from "../store/useVaultStore";

const CATEGORIES = ["Identity", "Finance", "Insurance", "Vehicle", "Property", "Medical", "Other"];

export default function AddDocumentScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const uploadMutation = useUploadDocument();
  const setIsPickingFile = useVaultStore((state) => state.setIsPickingFile);

  const handlePickDocument = async () => {
    try {
      setIsPickingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileAsset = result.assets[0];
        
        // 10MB limit check
        if (fileAsset.size > 10 * 1024 * 1024) {
          Alert.alert("File Too Large", "Please select a file smaller than 10MB.");
          return;
        }

        setSelectedFile(fileAsset);
        
        // Auto-fill title if empty
        if (!title) {
          setTitle(fileAsset.name.split('.')[0]);
        }
      }
    } catch (err) {
      console.error("Document picking error:", err);
      Alert.alert("Error", "Failed to pick document");
    } finally {
      setIsPickingFile(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Missing Information", "Please provide a document title.");
      return;
    }

    if (!selectedFile) {
      Alert.alert("Missing Document", "Please pick a file to upload.");
      return;
    }

    uploadMutation.mutate(
      {
        fileObj: selectedFile,
        metadata: { title: title.trim(), category, expiryDate: expiryDate.trim() },
      },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (error) => {
          Alert.alert("Upload Failed", error.message);
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Document</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* File Picker Section */}
        <View style={styles.pickerSection}>
          <Text style={styles.label}>Selected File</Text>
          {selectedFile ? (
            <View style={styles.selectedFileBox}>
              <Text style={styles.selectedFileIcon}>
                {selectedFile.mimeType?.includes("pdf") ? "📄" : "🖼️"}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedFileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.selectedFileSize}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.removeFileBtn}>
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickFileButton} onPress={handlePickDocument}>
              <Text style={styles.pickFileIcon}>📁</Text>
              <Text style={styles.pickFileText}>Tap to pick a PDF or Image</Text>
              <Text style={styles.pickFileSubText}>(Max 10MB)</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Passport, Tax Return 2025"
            placeholderTextColor="#5b5b66"
            value={title}
            onChangeText={setTitle}
            editable={!uploadMutation.isPending}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expiry Date (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#5b5b66"
            value={expiryDate}
            onChangeText={setExpiryDate}
            editable={!uploadMutation.isPending}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
                disabled={uploadMutation.isPending}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, uploadMutation.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Secure Upload</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121214",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c21",
    backgroundColor: "#121214",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backButtonText: {
    color: "#00b37e",
    fontSize: 28,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  pickerSection: {
    marginBottom: 24,
  },
  pickFileButton: {
    backgroundColor: "#1c1c21",
    borderWidth: 1,
    borderColor: "#29292e",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pickFileIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  pickFileText: {
    color: "#c4c4cc",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  pickFileSubText: {
    color: "#8d8d99",
    fontSize: 13,
  },
  selectedFileBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c21",
    borderWidth: 1,
    borderColor: "#00b37e",
    borderRadius: 12,
    padding: 16,
  },
  selectedFileIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  selectedFileName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  selectedFileSize: {
    color: "#8d8d99",
    fontSize: 12,
  },
  removeFileBtn: {
    padding: 8,
    marginLeft: 8,
  },
  removeFileText: {
    color: "#f75a68",
    fontSize: 18,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: "#c4c4cc",
    fontSize: 15,
    marginBottom: 10,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1c1c21",
    borderWidth: 1,
    borderColor: "#29292e",
    borderRadius: 8,
    padding: 16,
    color: "#ffffff",
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    backgroundColor: "#1c1c21",
    borderWidth: 1,
    borderColor: "#29292e",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryChipActive: {
    backgroundColor: "#00b37e",
    borderColor: "#00b37e",
  },
  categoryText: {
    color: "#8d8d99",
    fontWeight: "bold",
    fontSize: 14,
  },
  categoryTextActive: {
    color: "#ffffff",
  },
  saveButton: {
    backgroundColor: "#00b37e",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
