import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
} from "react-native";
import { useGlobalSearch, useDebounce } from "../hooks/useSearch";
import { useSearchStore } from "../store/useSearchStore";
import SearchResultCard from "../components/SearchResultCard";

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const { data: results, isLoading, isFetching } = useGlobalSearch(debouncedQuery);
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useSearchStore();

  const searchInputRef = useRef(null);

  // Auto focus the search bar when the screen loads
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const handleResultPress = (item) => {
    // Add to recent searches when a result is tapped
    addRecentSearch(debouncedQuery);

    if (item.type === "card") {
      navigation.navigate("CardDetails", { id: item.id });
    } else if (item.type === "password") {
      navigation.navigate("PasswordDetails", { id: item.id });
    } else if (item.type === "document") {
      navigation.navigate("DocumentDetails", { id: item.id });
    } else if (item.type === "bank") {
      // Future-proof
      console.log("Navigate to Bank", item.id);
    }
  };

  const handleRecentSearchPress = (searchQuery) => {
    setQuery(searchQuery);
  };

  const clearSearch = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };

  const renderRecentSearchItem = ({ item }) => (
    <View style={styles.recentItemRow}>
      <TouchableOpacity 
        style={styles.recentItemClickable} 
        onPress={() => handleRecentSearchPress(item)}
      >
        <Text style={styles.recentIcon}>🕒</Text>
        <Text style={styles.recentText}>{item}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeRecentSearch(item)} style={styles.removeRecentBtn}>
        <Text style={styles.removeRecentText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    // 1. Loading state
    if (isLoading || (isFetching && query !== debouncedQuery)) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00b37e" />
          <Text style={styles.loadingText}>Searching vault...</Text>
        </View>
      );
    }

    // 2. Results list (if query exists and results are fetched)
    if (debouncedQuery.trim().length > 0 && results) {
      if (results.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any matches for "{debouncedQuery}"
            </Text>
          </View>
        );
      }

      return (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={({ item }) => (
            <SearchResultCard item={item} onPress={() => handleResultPress(item)} />
          )}
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
        />
      );
    }

    // 3. Empty State / Recent Searches (when query is empty)
    if (recentSearches.length > 0) {
      return (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            keyExtractor={(item) => item}
            renderItem={renderRecentSearchItem}
            contentContainerStyle={styles.recentListContainer}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      );
    }

    // 4. Pure empty state
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🌎</Text>
        <Text style={styles.emptyTitle}>Global Vault Search</Text>
        <Text style={styles.emptySubtitle}>
          Search across cards, passwords, and more.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.searchBarContainer}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search vault..."
            placeholderTextColor="#5b5b66"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121214",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c21",
    backgroundColor: "#121214",
  },
  backButton: {
    paddingRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#00b37e",
    fontSize: 24,
    fontWeight: "bold",
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c21",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#29292e",
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 12,
  },
  clearButtonText: {
    color: "#8d8d99",
    fontSize: 14,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#00b37e",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#8d8d99",
    fontSize: 15,
    textAlign: "center",
  },
  listContainer: {
    padding: 24,
    paddingBottom: 80,
  },
  recentContainer: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  clearAllText: {
    color: "#f75a68",
    fontSize: 14,
    fontWeight: "600",
  },
  recentListContainer: {
    paddingHorizontal: 24,
  },
  recentItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c21",
  },
  recentItemClickable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  recentIcon: {
    marginRight: 12,
    fontSize: 16,
    opacity: 0.7,
  },
  recentText: {
    color: "#c4c4cc",
    fontSize: 16,
  },
  removeRecentBtn: {
    padding: 8,
  },
  removeRecentText: {
    color: "#8d8d99",
    fontSize: 12,
  },
});
