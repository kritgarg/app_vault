import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  ScrollView,
  Platform,
  Linking,
  Alert,
  Image,
} from "react-native";
import { useDocument, useDeleteDocument, useToggleDocumentFavorite } from "../hooks/useDocuments";
import { useBiometrics } from "../hooks/useBiometrics";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function DocumentDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { data: document, isLoading, error } = useDocument(id);
  const deleteMutation = useDeleteDocument();
  const toggleFavMutation = useToggleDocumentFavorite();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isRevealed, setIsRevealed] = React.useState(false);
  const { authenticate, isSupported } = useBiometrics();

  const handleReveal = async () => {
    if (isSupported) {
      const authResult = await authenticate("Verify your identity to view secure document");
      if (!authResult.success) {
        Alert.alert("Authentication Failed", authResult.error || "Could not verify identity");
        return;
      }
    }
    setIsRevealed(true);
  };

  React.useEffect(() => {
    let timeout;
    if (isRevealed) {
      // Auto hide document after 60 seconds of inactivity
      timeout = setTimeout(() => {
        setIsRevealed(false);
      }, 60000); 
    }
    return () => clearTimeout(timeout);
  }, [isRevealed]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00b37e" />
      </View>
    );
  }

  if (error || !document) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Document not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} color="#00b37e" />
      </View>
    );
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadDocument = async () => {
    try {
      setIsDownloading(true);
      
      // Determine a safe local file path
      const fileExt = document.fileName.split('.').pop() || 'pdf';
      const localUri = `${FileSystem.documentDirectory}${document.id}.${fileExt}`;

      // Download the file from the secure URL
      const { uri } = await FileSystem.downloadAsync(document.fileUrl, localUri);

      // Prompt the user to save/share the file natively
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: document.fileType,
          dialogTitle: "Save Document",
          UTI: document.fileType.includes("pdf") ? "com.adobe.pdf" : "public.image", // iOS hint
        });
      } else {
        Alert.alert("Sharing Not Available", "Your device does not support native file sharing.");
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      Alert.alert("Download Failed", "There was an error saving the document.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to permanently delete this document?",
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
              onError: (err) => {
                Alert.alert("Delete Failed", err.message);
              },
            });
          },
        },
      ]
    );
  };

  const handleToggleFavorite = () => {
    toggleFavMutation.mutate(id, {
      onSuccess: () => {
        // Success handled by hook invalidation
      },
      onError: (err) => {
        Alert.alert("Error", err.message || "Failed to update favorite status.");
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Details</Text>
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={handleToggleFavorite}
          disabled={toggleFavMutation.isPending}
        >
          <Text style={styles.favoriteIcon}>{document?.favorite ? "⭐" : "☆"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSection}>
          <View style={styles.previewContainer}>
            {!isRevealed ? (
              <View style={styles.lockedContainer}>
                <Text style={styles.largeIcon}>🔒</Text>
                <Text style={styles.lockedText}>Secure Document</Text>
                <TouchableOpacity style={styles.unlockButton} onPress={handleReveal}>
                  <Text style={styles.unlockButtonText}>Unlock to View</Text>
                </TouchableOpacity>
              </View>
            ) : document.fileType?.includes("image") ? (
              <Image source={{ uri: document.fileUrl }} style={styles.previewImage} resizeMode="contain" />
            ) : document.fileType?.includes("pdf") ? (
              <WebView 
                source={{ uri: Platform.OS === 'android' ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(document.fileUrl)}` : document.fileUrl }} 
                style={styles.previewPdf} 
                scalesPageToFit={true}
              />
            ) : (
              <View style={styles.iconContainer}>
                <Text style={styles.largeIcon}>📁</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{document.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{document.category}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>File Name</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{document.fileName}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>File Size</Text>
            <Text style={styles.detailValue}>{formatFileSize(document.fileSize)}</Text>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Uploaded On</Text>
            <Text style={styles.detailValue}>
              {new Date(document.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.viewButton, (!isRevealed || isDownloading) && styles.buttonDisabled]} 
          onPress={downloadDocument}
          disabled={!isRevealed || isDownloading}
        >
          {isDownloading ? (
             <ActivityIndicator color="#ffffff" />
          ) : (
             <Text style={styles.viewButtonText}>
               {!isRevealed ? "Unlock to Export" : "Share / Download"}
             </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <ActivityIndicator color="#f75a68" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Document</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  favoriteButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  favoriteIcon: {
    fontSize: 24,
    color: "#ffffff",
  },
  scrollContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121214",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121214",
  },
  errorText: {
    color: "#f75a68",
    fontSize: 18,
    marginBottom: 20,
  },
  scrollContent: {
    padding: 24,
  },
  topSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  previewContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewPdf: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lockedText: {
    color: "#8d8d99",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    fontWeight: "bold",
  },
  unlockButton: {
    backgroundColor: "#29292e",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00b37e",
  },
  unlockButtonText: {
    color: "#00b37e",
    fontWeight: "bold",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1c1c21",
    borderWidth: 1,
    borderColor: "#29292e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  largeIcon: {
    fontSize: 40,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  categoryBadge: {
    backgroundColor: "#1c1c21",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00b37e",
  },
  categoryBadgeText: {
    color: "#00b37e",
    fontWeight: "bold",
    fontSize: 12,
  },
  detailsCard: {
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 20,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#29292e",
    my: 8,
  },
  detailLabel: {
    color: "#8d8d99",
    fontSize: 15,
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  viewButton: {
    backgroundColor: "#00b37e",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f75a68",
    backgroundColor: "transparent",
  },
  deleteButtonText: {
    color: "#f75a68",
    fontSize: 16,
    fontWeight: "bold",
  },
});
