import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  TextInput,
  Platform,
} from "react-native";
import { useCards } from "../hooks/useCards";

export default function CardsListScreen({ navigation }) {
  const { data: cards, isLoading, error, refetch } = useCards();

  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedBanks, setCollapsedBanks] = useState({});

  // Toggles the collapse state of a bank group
  const toggleSection = (bankName) => {
    setCollapsedBanks((prev) => ({
      ...prev,
      [bankName]: !prev[bankName],
    }));
  };

  // Filter cards based on search query
  const getFilteredCards = () => {
    if (!cards) return [];
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return cards;

    return cards.filter((card) => {
      return (
        (card.name || "").toLowerCase().includes(query) ||
        (card.bank || "").toLowerCase().includes(query) ||
        (card.bankName || "").toLowerCase().includes(query) ||
        (card.network || "").toLowerCase().includes(query)
      );
    });
  };

  // Groups and maps filtered cards into SectionList compatible structures
  const getGroupedSections = () => {
    const filtered = getFilteredCards();
    
    const groups = filtered.reduce((acc, card) => {
      const key = card.bankName || card.bank || "Other Banks";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(card);
      return acc;
    }, {});

    return Object.keys(groups)
      .sort()
      .map((bank) => {
        const isCollapsed = !!collapsedBanks[bank];
        return {
          title: bank,
          totalCount: groups[bank].length, // Retains accurate total count in header
          data: isCollapsed ? [] : groups[bank], // Empties array to hide items natively
        };
      });
  };

  const renderCardItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cardItem}
      onPress={() => navigation.navigate("CardDetails", { id: item.id })}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>💳 {item.name}</Text>
        {item.network ? (
          <View style={styles.networkBadge}>
            <Text style={styles.networkBadgeText}>{item.network}</Text>
          </View>
        ) : null}
      </View>
      
      {item.bank && item.bankName && item.bank.toLowerCase() !== item.bankName.toLowerCase() ? (
        <Text style={styles.cardSubtitle}>Label: {item.bank}</Text>
      ) : null}

      <Text style={styles.cardNumber}>{item.cardNumber}</Text>
    </TouchableOpacity>
  );

  const filteredCount = getFilteredCards().length;
  const sections = getGroupedSections();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Vault</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddCard")}
        >
          <Text style={styles.addButtonText}>+ Add Card</Text>
        </TouchableOpacity>
      </View>

      {/* Premium Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, bank, or network..."
        placeholderTextColor="#5b5b66"
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
        autoCapitalize="none"
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#00b37e" style={styles.loader} />
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error.message || "Failed to load cards"}</Text>
          <Button title="Retry" onPress={refetch} color="#00b37e" />
        </View>
      ) : cards && cards.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No cards stored yet.</Text>
          <Text style={styles.emptySubtitle}>Click the button above to add a card.</Text>
        </View>
      ) : filteredCount === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No matching cards found.</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search keywords.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderCardItem}
          renderSectionHeader={({ section: { title, totalCount } }) => {
            const isCollapsed = !!collapsedBanks[title];
            return (
              <TouchableOpacity
                style={styles.sectionHeaderRow}
                onPress={() => toggleSection(title)}
                activeOpacity={0.8}
              >
                <Text style={styles.sectionHeaderTitle}>
                  🏦 {title} ({totalCount})
                </Text>
                <Text style={styles.sectionToggleText}>
                  {isCollapsed ? "▶" : "▼"}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContainer}
          stickySectionHeadersEnabled={false}
        />
      )}
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
  addButton: {
    backgroundColor: "#00b37e",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
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
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  listContainer: {
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#121214",
    paddingVertical: 12,
    marginTop: 18,
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
  sectionToggleText: {
    color: "#8d8d99",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardItem: {
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 20,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  cardSubtitle: {
    color: "#8d8d99",
    fontSize: 13,
    marginTop: 2,
  },
  networkBadge: {
    backgroundColor: "#121214",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#29292e",
  },
  networkBadgeText: {
    color: "#00b37e",
    fontSize: 11,
    fontWeight: "bold",
  },
  cardNumber: {
    color: "#c4c4cc",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    marginTop: 14,
    letterSpacing: 2,
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
});
