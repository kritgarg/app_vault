import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Premium Credit Card Preview component with front and back rendering.
 * @param {object} props
 * @param {string} props.name - Cardholder/Custom name.
 * @param {string} props.bank - Bank name.
 * @param {string} props.cardNumber - Masked or unmasked card number.
 * @param {string} props.expiry - Expiry date (MM/YY).
 * @param {string} props.cvv - Masked or unmasked CVV.
 * @param {string} props.network - Card network (e.g. Visa, Mastercard).
 * @param {string} props.cardType - Card type (e.g. Credit, Debit).
 * @param {string} props.notes - Secure notes text.
 * @param {boolean} props.isBack - Renders the back of the card if true.
 */
export default function CardPreview({
  name,
  bank,
  cardNumber,
  expiry,
  cvv,
  network,
  cardType,
  notes,
  isBack = false,
}) {
  const formatCardNumber = (num) => {
    if (!num) return "•••• •••• •••• ••••";
    // Strip spacing if any and separate into 4-character chunks
    const cleaned = num.replace(/\s?/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join("  ") : num;
  };

  // Select card theme color gradient based on the card network
  const getGradientColors = () => {
    const netLower = (network || "").toLowerCase();
    if (netLower.includes("visa")) {
      return ["#0f2027", "#203a43", "#2c5364"]; // Sleek dark teal/blue
    } else if (netLower.includes("mastercard")) {
      return ["#141e30", "#243b55"]; // Dark blue/grey metallic
    } else if (netLower.includes("american express") || netLower.includes("amex")) {
      return ["#1e130c", "#964d22"]; // Warm bronze/metallic gold
    } else if (netLower.includes("rupay")) {
      return ["#1d976c", "#93f9b9"]; // Emerald green gradient
    }
    return ["#1e1e24", "#2c2c35", "#3a3a45"]; // Premium obsidian carbon fallback
  };

  if (isBack) {
    return (
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Magnetic Stripe */}
          <View style={styles.magneticStripe} />

          {/* Signature Panel & CVV */}
          <View style={styles.signatureRow}>
            <View style={styles.signaturePanel}>
              <Text style={styles.signatureText}>Authorized Signature</Text>
            </View>
            <View style={styles.cvvBox}>
              <Text style={styles.cvvLabel}>CVV</Text>
              <Text style={styles.cvvText}>{cvv || "•••"}</Text>
            </View>
          </View>

          {/* Notes & Card Info */}
          <View style={styles.backFooter}>
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Secure Notes:</Text>
              <Text style={styles.notesText} numberOfLines={2}>
                {notes || "No notes stored for this card."}
              </Text>
            </View>
            {network ? (
              <View style={styles.backNetworkContainer}>
                <Text style={styles.backNetworkText}>{network.toUpperCase()}</Text>
                {cardType ? <Text style={styles.backTypeText}>{cardType}</Text> : null}
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Top Section: Bank & Type */}
        <View style={styles.cardHeader}>
          <Text style={styles.bankName}>{bank || "Vault Card"}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {cardType ? cardType.toUpperCase() : "SECURE"}
            </Text>
          </View>
        </View>

        {/* Middle Section: EMV Chip & Number */}
        <View style={styles.chipRow}>
          <View style={styles.emvChip}>
            <View style={styles.chipLineHorizontal} />
            <View style={styles.chipLineVertical} />
            <View style={styles.chipInner} />
          </View>
        </View>

        <Text style={styles.cardNumberText}>{formatCardNumber(cardNumber)}</Text>

        {/* Bottom Section: Name, Expiry & Network */}
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>CARDHOLDER</Text>
            <Text style={styles.footerValue} numberOfLines={1}>
              {name.toUpperCase()}
            </Text>
          </View>

          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>EXPIRES</Text>
            <Text style={styles.footerValue}>{expiry || "••/••"}</Text>
          </View>

          {network ? (
            <View style={styles.networkBadgeContainer}>
              <Text style={styles.networkName}>{network}</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    height: 210,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  // Front Styles
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  typeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  chipRow: {
    marginTop: 10,
    marginBottom: 5,
  },
  emvChip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#d4af37", // Metallic gold
    borderWidth: 1,
    borderColor: "#b8972f",
    overflow: "hidden",
    position: "relative",
  },
  chipLineHorizontal: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#555",
  },
  chipLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 19,
    width: 1,
    backgroundColor: "#555",
  },
  chipInner: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 8,
    right: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#555",
    backgroundColor: "transparent",
  },
  cardNumberText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  networkBadgeContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  networkName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  // Back Styles
  magneticStripe: {
    height: 40,
    backgroundColor: "#111111",
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
  },
  signatureRow: {
    flexDirection: "row",
    marginTop: 55,
    alignItems: "center",
    gap: 12,
  },
  signaturePanel: {
    flex: 1,
    height: 38,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingLeft: 10,
    borderRadius: 2,
  },
  signatureText: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 11,
    fontStyle: "italic",
    color: "#444444",
  },
  cvvBox: {
    backgroundColor: "#121214",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#29292e",
    alignItems: "center",
  },
  cvvLabel: {
    color: "#8d8d99",
    fontSize: 8,
    fontWeight: "bold",
  },
  cvvText: {
    color: "#00b37e",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  backFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
  },
  notesContainer: {
    flex: 1,
    marginRight: 16,
  },
  notesLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
  },
  notesText: {
    color: "#c4c4cc",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  backNetworkContainer: {
    alignItems: "flex-end",
  },
  backNetworkText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  backTypeText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 2,
  },
});
