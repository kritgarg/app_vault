/**
 * Service to perform BIN (Bank Identification Number) Lookups.
 * Resolves details about card issuer bank, network brand, and card type.
 */

// Helper to convert strings to Title Case for visual consistency (e.g. "HDFC BANK" -> "HDFC Bank")
function toTitleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Local fallback regex parser to resolve card networks and details offline.
 * @param {string} bin - 6 to 8 digit BIN.
 * @returns {object} Mock or partially resolved BIN object.
 */
function resolveLocally(bin) {
  const cleanBin = bin.replace(/\D/g, "");
  let network = "Unknown";
  let bankName = "Unknown Bank";
  let cardType = "Credit"; // Default assumption

  // Major card brand ranges:
  if (/^4/.test(cleanBin)) {
    network = "Visa";
  } else if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cleanBin)) {
    network = "Mastercard";
  } else if (/^3[47]/.test(cleanBin)) {
    network = "American Express";
  } else if (/^(60|65|81|82)/.test(cleanBin)) {
    network = "RuPay";
  } else if (/^(30[0-5]|3095|36|38|39)/.test(cleanBin)) {
    network = "Diners Club";
  } else if (/^35(2[8-9]|[3-8])/.test(cleanBin)) {
    network = "JCB";
  } else if (/^(6011|622|64|65)/.test(cleanBin)) {
    network = "Discover";
  }

  // Common Indian bank BIN fallbacks for demo purposes (if offline)
  if (/^411111/.test(cleanBin)) {
    bankName = "HDFC Bank";
  } else if (/^422222/.test(cleanBin)) {
    bankName = "ICICI Bank";
  } else if (/^512345/.test(cleanBin)) {
    bankName = "SBI";
  }

  return {
    success: true,
    bankName,
    network,
    cardType,
    source: "local_fallback",
  };
}

/**
 * Resolves card details for a given BIN by querying a public API, falling back to local detection on failure.
 * @param {string} bin - The 6-8 digit BIN string.
 * @returns {Promise<object>} Card metadata.
 */
export async function lookupBIN(bin) {
  const cleanBin = bin.replace(/\D/g, "").slice(0, 8);
  
  if (cleanBin.length < 6) {
    throw new Error("Invalid BIN. Must be at least 6 digits.");
  }

  const queryBin = cleanBin.slice(0, 6);

  try {
    // Timeout-guarded fetch to avoid blocking requests if service is slow
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

    const response = await fetch(`https://data.handyapi.com/bin/${queryBin}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`External API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data && data.Status === "SUCCESS") {
      return {
        success: true,
        bankName: toTitleCase(data.Issuer) || "Unknown Bank",
        network: toTitleCase(data.Scheme) || "Unknown Network",
        cardType: toTitleCase(data.Type) || "Credit",
        source: "api_lookup",
      };
    }

    // If API response is valid but status is not SUCCESS, trigger local resolution
    return resolveLocally(cleanBin);
  } catch (error) {
    console.warn(`BIN API Lookup failed for ${queryBin}. Falling back to local resolution.`, error.message);
    return resolveLocally(cleanBin);
  }
}
