export const parseCardData = (blocks) => {
  let cardNumber = null;
  let expiry = null;
  let name = null;

  const lines = blocks
    .map(b => b.text)
    .join("\n")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Exclude common keywords that aren't the cardholder name
  const ignoreKeywords = [
    "VALID", "THRU", "VALID THRU", "CREDIT", "DEBIT", "VISA", "MASTERCARD", 
    "DISCOVER", "AMEX", "AMERICAN EXPRESS", "BANK", "CARD", "GOOD", "THRU"
  ];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1. Try to find Card Number
    // Replace common OCR mistakes for numbers (O -> 0, I/l -> 1, S -> 5)
    let numberCandidate = line.replace(/O/gi, "0").replace(/[Il]/g, "1").replace(/S/gi, "5");
    const cleanedNumber = numberCandidate.replace(/[\s-]/g, "");
    
    // Check if it's 13-19 digits
    if (/^\d{13,19}$/.test(cleanedNumber) && !cardNumber) {
      cardNumber = cleanedNumber;
      continue;
    }

    // 2. Try to find Expiry Date
    // Handle formats like "12/24", "12 / 24", "12-24", "12/2024"
    const expiryMatch = line.match(/\b(0[1-9]|1[0-2])\s*[\/\-]\s*([0-9]{2}|[0-9]{4})\b/);
    if (expiryMatch && !expiry) {
      // Normalize to MM/YY
      let month = expiryMatch[1];
      let year = expiryMatch[2];
      if (year.length === 4) year = year.substring(2);
      expiry = `${month}/${year}`;
      continue;
    }

    // 3. Try to find Name
    // Usually all caps, 2-3 words, > 4 chars. Sometimes has title like MR, MRS
    // Relaxed to allow some lowercase or OCR anomalies
    if (!name && /^[A-Z\s\.]+$/i.test(line) && line.length > 5 && line.includes(" ")) {
      // Exclude strings that have too many numbers (handled by above regex anyway)
      const isIgnored = ignoreKeywords.some(kw => line.toUpperCase().includes(kw));
      if (!isIgnored) {
        // Exclude lines that are just single characters separated by spaces e.g. "V I S A"
        if (!/^([A-Z]\s)+[A-Z]$/i.test(line)) {
            name = line.toUpperCase();
        }
      }
    }
  }

  return { cardNumber, expiry, name };
};
