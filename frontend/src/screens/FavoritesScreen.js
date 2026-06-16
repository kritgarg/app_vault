import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useCards } from "../hooks/useCards";
import { usePasswords } from "../hooks/usePasswords";
import { useDocuments } from "../hooks/useDocuments";

export default function FavoritesScreen({ navigation }) {
  const { data: cards, isLoading: cardsLoading } = useCards();
  const { data: passwords, isLoading: passwordsLoading } = usePasswords();
  const { data: documents, isLoading: documentsLoading } = useDocuments();

  const isLoading = cardsLoading || passwordsLoading || documentsLoading;

  const favoriteCards = cards ? cards.filter((c) => c.favorite) : [];
  const favoritePasswords = passwords ? passwords.filter((p) => p.favorite) : [];
  const favoriteDocuments = documents ? documents.filter((d) => d.favorite) : [];

  const totalFavorites = favoriteCards.length + favoritePasswords.length + favoriteDocuments.length;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00b37e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {totalFavorites === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>No favorites yet.</Text>
            <Text style={styles.emptySubtext}>
              Star your most used cards, passwords, and documents to see them here.
            </Text>
          </View>
        ) : (
          <>
            {favoriteCards.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cards</Text>
                {favoriteCards.map((card) => (
                  <TouchableOpacity
                    key={`card-${card.id}`}
                    style={styles.itemCard}
                    onPress={() => navigation.navigate("CardDetails", { id: card.id })}
                  >
                    <Text style={styles.itemIcon}>💳</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{card.name}</Text>
                      <Text style={styles.itemSubtitle}>{card.bank}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {favoritePasswords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Passwords</Text>
                {favoritePasswords.map((pwd) => (
                  <TouchableOpacity
                    key={`pwd-${pwd.id}`}
                    style={styles.itemCard}
                    onPress={() => navigation.navigate("PasswordDetails", { id: pwd.id })}
                  >
                    <Text style={styles.itemIcon}>🔑</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{pwd.title}</Text>
                      <Text style={styles.itemSubtitle}>{pwd.username || "No username"}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {favoriteDocuments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Documents</Text>
                {favoriteDocuments.map((doc) => (
                  <TouchableOpacity
                    key={`doc-${doc.id}`}
                    style={styles.itemCard}
                    onPress={() => navigation.navigate("DocumentDetails", { id: doc.id })}
                  >
                    <Text style={styles.itemIcon}>📄</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{doc.title}</Text>
                      <Text style={styles.itemSubtitle}>{doc.category || "Other"}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121214",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#8d8d99",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#c4c4cc",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c21",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    marginBottom: 12,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemSubtitle: {
    color: "#8d8d99",
    fontSize: 13,
  },
});
