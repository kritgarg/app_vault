import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

export default function SearchResultCard({ item, onPress }) {
  const getIcon = () => {
    switch (item.type) {
      case "card":
        return "💳";
      case "password":
        return "🔑";
      case "document":
        return "📄";
      case "bank":
        return "🏦";
      default:
        return "📁";
    }
  };

  const getBadgeColor = () => {
    switch (item.type) {
      case "card":
        return "#1c3d5a"; // Dark blue-ish
      case "password":
        return "#1a4d2e"; // Dark green-ish
      case "document":
        return "#4a1c40"; // Dark purple-ish
      default:
        return "#29292e";
    }
  };

  const getBadgeTextColor = () => {
    switch (item.type) {
      case "card":
        return "#63b3ed";
      case "password":
        return "#48bb78";
      case "document":
        return "#b794f4";
      default:
        return "#c4c4cc";
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getIcon()}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
        ) : null}
      </View>
      <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
        <Text style={[styles.badgeText, { color: getBadgeTextColor() }]}>
          {item.type.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c21",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29292e",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#29292e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#8d8d99",
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
});
