import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import { useCards } from "../hooks/useCards";

export default function DetailsScreen({ navigation }) {
  const { data: cards, isLoading, error } = useCards();

  // Other categories for future expansion
  const categories = [
    { id: "passwords", title: "🔑 Passwords", description: "Credentials for websites and apps" },
    { id: "documents", title: "📄 Documents", description: "Passports, IDs, and driver licenses" },
    { id: "bank", title: "🏦 Bank Accounts", description: "Routing and account details" },
  ];

  const totalCards = cards ? cards.length : 0;

  // Calculate unique bank count and cards breakdown
  const bankBreakdown = cards
    ? cards.reduce((acc, card) => {
        const bank = card.bankName || card.bank || "Other Banks";
        acc[bank] = (acc[bank] || 0) + 1;
        return acc;
      }, {})
    : {};

  const uniqueBanksCount = Object.keys(bankBreakdown).length;

  // Recently added cards (first 3, since array is sorted by createdAt desc)
  const recentCards = cards ? cards.slice(0, 3) : [];

  const renderRecentCardItem = ({ item }) => {
    // Select card background colors
    const getBadgeColor = () => {
      const net = (item.network || "").toLowerCase();
      if (net.includes("visa")) return "#2c5364";
      if (net.includes("mastercard")) return "#243b55";
      if (net.includes("amex")) return "#964d22";
      return "#29292e";
    };

    return (
      <TouchableOpacity
        style={[styles.recentCard, { backgroundColor: getBadgeColor() }]}
        onPress={() => navigation.navigate("CardDetails", { id: item.id })}
      >
        <View style={styles.recentCardHeader}>
          <Text style={styles.recentCardBank} numberOfLines={1}>
            {item.bankName || item.bank}
          </Text>
          {item.network ? <Text style={styles.recentCardNetwork}>{item.network}</Text> : null}
        </View>
        <Text style={styles.recentCardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.recentCardNumber}>{item.cardNumber}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Dashboard Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>FamilyVault</Text>
        <Text style={styles.subtitle}>🛡️ Secure Zero-Knowledge Vault</Text>
      </View>

      {/* Stats Cards Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Cards</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#00b37e" style={styles.statLoader} />
          ) : (
            <Text style={styles.statValue}>{totalCards}</Text>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Banks</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#00b37e" style={styles.statLoader} />
          ) : (
            <Text style={styles.statValue}>{uniqueBanksCount}</Text>
          )}
        </View>
      </View>

      {/* Quick Add CTA Button */}
      <TouchableOpacity
        style={styles.quickAddCTA}
        onPress={() => navigation.navigate("AddCard")}
      >
        <Text style={styles.quickAddCTAText}>💳 Quick Add Card</Text>
      </TouchableOpacity>

      {/* Recently Added Section */}
      {!isLoading && recentCards.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <TouchableOpacity onPress={() => navigation.navigate("CardsList")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={recentCards}
            renderItem={renderRecentCardItem}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Cards by Bank Breakdown */}
      {!isLoading && totalCards > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Cards by Bank</Text>
          <View style={styles.breakdownCard}>
            {Object.entries(bankBreakdown).map(([bank, count], index, arr) => (
              <View key={bank}>
                <TouchableOpacity
                  style={styles.breakdownRow}
                  onPress={() => navigation.navigate("CardsList")}
                >
                  <Text style={styles.breakdownBankName}>🏦 {bank}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {count} {count === 1 ? "card" : "cards"}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index < arr.length - 1 && <View style={styles.innerDivider} />}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Other Vault Categories Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Other Categories</Text>
        <View style={styles.categoriesList}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => console.log(`Selected category: ${category.id}`)}
            >
              <View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDesc}>{category.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121214",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  logoText: {
    fontSize: 30,
    fontWeight: "900",
    color: "#00b37e",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#8d8d99",
    marginTop: 4,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 16,
    height: 90,
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#8d8d99",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
  },
  statLoader: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  quickAddCTA: {
    backgroundColor: "#00b37e",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#00b37e",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quickAddCTAText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  viewAllText: {
    color: "#00b37e",
    fontSize: 14,
    fontWeight: "bold",
  },
  horizontalList: {
    gap: 12,
    paddingRight: 12,
  },
  recentCard: {
    width: 200,
    height: 110,
    borderRadius: 12,
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  recentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentCardBank: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    flex: 1,
  },
  recentCardNetwork: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "bold",
    fontStyle: "italic",
    marginLeft: 6,
  },
  recentCardTitle: {
    color: "#c4c4cc",
    fontSize: 14,
    fontWeight: "600",
  },
  recentCardNumber: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  breakdownCard: {
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  breakdownBankName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: "#121214",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#29292e",
  },
  countBadgeText: {
    color: "#00b37e",
    fontSize: 12,
    fontWeight: "bold",
  },
  innerDivider: {
    height: 1,
    backgroundColor: "#29292e",
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#1c1c21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    padding: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  categoryDesc: {
    fontSize: 13,
    color: "#8d8d99",
    marginTop: 4,
  },
});
