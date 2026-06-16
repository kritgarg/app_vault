import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  TextInput,
  Platform,
} from "react-native";
import { usePasswords } from "../hooks/usePasswords";

const CATEGORIES = ["All", "Banking", "Social", "Shopping", "Work", "Entertainment", "WiFi", "Other"];

export default function PasswordsListScreen({ navigation }) {
  const { data: passwords, isLoading, error, refetch } = usePasswords();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const getFilteredPasswords = () => {
    if (!passwords) return [];
    
    let filtered = passwords;

    if (categoryFilter !== "All") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(p => 
        (p.title || "").toLowerCase().includes(query) ||
        (p.username || "").toLowerCase().includes(query) ||
        (p.website || "").toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredPasswords = getFilteredPasswords();
  const favoritePasswords = filteredPasswords.filter(p => p.favorite);
  const otherPasswords = filteredPasswords.filter(p => !p.favorite);

  const listData = [
    ...(favoritePasswords.length > 0 ? [{ id: "header-fav", isHeader: true, title: "Favorites" }, ...favoritePasswords] : []),
    ...(otherPasswords.length > 0 ? [{ id: "header-other", isHeader: true, title: favoritePasswords.length > 0 ? "Others" : "All Passwords" }, ...otherPasswords] : [])
  ];

  const renderItem = ({ item }) => {
    if (item.isHeader) {
      return (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>{item.title}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.passwordItem}
        onPress={() => navigation.navigate("PasswordDetails", { id: item.id })}
      >
        <View style={styles.passwordHeaderRow}>
          <Text style={styles.passwordTitle}>{item.favorite ? "⭐ " : ""}{item.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category || "Other"}</Text>
          </View>
        </View>
        
        {item.username ? (
          <Text style={styles.passwordSubtitle}>{item.username}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Passwords</Text>
        <TouchableOpacity style={styles.searchButton} onPress={() => navigation.navigate("SearchScreen")}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by title, username, or website..."
        placeholderTextColor="#5b5b66"
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
        autoCapitalize="none"
      />

      <View style={styles.filterContainerWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterButton, categoryFilter === item && styles.filterButtonActive]}
              onPress={() => setCategoryFilter(item)}
            >
              <Text style={[styles.filterText, categoryFilter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterContainer}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#00b37e" style={styles.loader} />
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error.message || "Failed to load passwords"}</Text>
          <Button title="Retry" onPress={refetch} color="#00b37e" />
        </View>
      ) : passwords && passwords.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No passwords stored yet.</Text>
          <Text style={styles.emptySubtitle}>Click the + button to add one.</Text>
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No matching passwords found.</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddPassword")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121214",
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1c1c21",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#29292e",
  },
  searchIcon: {
    fontSize: 20,
  },
  searchInput: {
    backgroundColor: "#1c1c21",
    color: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#29292e",
    fontSize: 15,
    marginBottom: 16,
  },
  filterContainerWrapper: {
    height: 40,
    marginBottom: 16,
  },
  filterContainer: {
    alignItems: "center",
    paddingRight: 24,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1c1c21",
    borderWidth: 1,
    borderColor: "#29292e",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#00b37e",
    borderColor: "#00b37e",
  },
  filterText: {
    color: "#8d8d99",
    fontWeight: "bold",
  },
  filterTextActive: {
    color: "#ffffff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  listContainer: {
    paddingBottom: 80,
  },
  sectionHeaderRow: {
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c21",
  },
  sectionHeaderTitle: {
    color: "#c4c4cc",
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  passwordItem: {
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 20,
    marginBottom: 12,
  },
  passwordHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passwordTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  passwordSubtitle: {
    color: "#8d8d99",
    fontSize: 14,
    marginTop: 6,
  },
  categoryBadge: {
    backgroundColor: "#121214",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#29292e",
  },
  categoryBadgeText: {
    color: "#00b37e",
    fontSize: 11,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  errorText: {
    color: "#f75a68",
    fontSize: 16,
    marginBottom: 16,
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  emptySubtitle: {
    color: "#8d8d99",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 24,
    backgroundColor: "#00b37e",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#00b37e",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "300",
    marginTop: Platform.OS === "ios" ? -2 : 0,
  },
});
