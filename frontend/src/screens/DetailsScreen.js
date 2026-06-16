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
import { useDashboard } from "../hooks/useDashboard";

export default function DetailsScreen({ navigation }) {
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();

  const categories = [
    { id: "cards", title: "💳 Cards", description: "Credit and debit cards" },
    { id: "passwords", title: "🔑 Passwords", description: "Credentials for websites and apps" },
    { id: "documents", title: "📄 Documents", description: "Passports, IDs, and driver licenses" },
  ];

  const totalCards = dashboard?.counts?.cards || 0;
  const totalPasswords = dashboard?.counts?.passwords || 0;
  const totalDocuments = dashboard?.counts?.documents || 0;

  const recentCards = dashboard?.recents?.cards || [];
  const recentPasswords = dashboard?.recents?.passwords || [];
  const recentDocuments = dashboard?.recents?.documents || [];
  const upcomingExpiries = dashboard?.expiries || [];
  const recentActivity = dashboard?.activity || [];

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
        <View>
          <Text style={styles.logoText}>FamilyVault</Text>
          <Text style={styles.subtitle}>🛡️ Secure Zero-Knowledge Vault</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("FavoritesScreen")}>
            <Text style={styles.iconButtonText}>⭐</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("SearchScreen")}>
            <Text style={styles.iconButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Cards</Text>
          {dashboardLoading ? (
            <ActivityIndicator size="small" color="#00b37e" style={styles.statLoader} />
          ) : (
            <Text style={styles.statValue}>{totalCards}</Text>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Passwords</Text>
          {dashboardLoading ? (
            <ActivityIndicator size="small" color="#00b37e" style={styles.statLoader} />
          ) : (
            <Text style={styles.statValue}>{totalPasswords}</Text>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Documents</Text>
          {dashboardLoading ? (
            <ActivityIndicator size="small" color="#00b37e" style={styles.statLoader} />
          ) : (
            <Text style={styles.statValue}>{totalDocuments}</Text>
          )}
        </View>
      </View>

      {/* Upcoming Expiries Widget */}
      {!dashboardLoading && upcomingExpiries.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming Expiries</Text>
          <View style={styles.categoriesList}>
            {upcomingExpiries.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={`expiry-${item.id}`}
                style={styles.expiryCard}
                onPress={() => {
                  if (item.type === "CARD") navigation.navigate("CardDetails", { id: item.id });
                  if (item.type === "DOCUMENT") navigation.navigate("DocumentDetails", { id: item.id });
                }}
              >
                <Text style={styles.itemIcon}>{item.type === "CARD" ? "💳" : "📄"}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.name || item.title}</Text>
                  <Text style={styles.expiryDateText}>
                    Expires: {new Date(item.expiryDate).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recently Added Cards */}
      {!dashboardLoading && recentCards.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recently Added Cards</Text>
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


      {/* Recent Activity Widget */}
      {!dashboardLoading && recentActivity.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.categoriesList}>
            {recentActivity.slice(0, 3).map((activity) => (
              <View key={`act-${activity.id}`} style={styles.activityCard}>
                <Text style={styles.activityDot}>•</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.activityAction}>{activity.action} {activity.entityType}</Text>
                  <Text style={styles.activityTime}>{new Date(activity.createdAt).toLocaleString()}</Text>
                </View>
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
              onPress={() => {
                if (category.id === "cards") {
                  navigation.navigate("CardsList");
                } else if (category.id === "passwords") {
                  navigation.navigate("PasswordsList");
                } else if (category.id === "documents") {
                  navigation.navigate("DocumentsList");
                } else {
                  console.log(`Selected category: ${category.id}`);
                }
              }}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1c1c21",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#29292e",
  },
  iconButtonText: {
    fontSize: 20,
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
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flexBasis: "47%",
    flexGrow: 1,
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
  expiryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c21",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(247, 90, 104, 0.4)",
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
  expiryDateText: {
    color: "#f75a68",
    fontSize: 13,
    fontWeight: "600",
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activityDot: {
    color: "#00b37e",
    fontSize: 24,
    marginRight: 12,
  },
  activityAction: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "500",
  },
  activityTime: {
    color: "#8d8d99",
    fontSize: 12,
    marginTop: 2,
  },
});
