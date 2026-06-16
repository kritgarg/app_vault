import express from "express";
import { prisma } from "../utils/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { lookupBIN } from "../services/bin.service.js";
import { activityService } from "../services/activity.service.js";

const router = express.Router();

// Apply auth requirement to all card endpoints
router.use(requireAuth);

// 1. BIN Lookup: GET /cards/bin/:bin
router.get("/bin/:bin", async (req, res) => {
  const { bin } = req.params;

  if (!bin || bin.length < 6) {
    return res.status(400).json({ error: "BIN must be at least 6 digits" });
  }

  try {
    const result = await lookupBIN(bin);
    return res.json(result);
  } catch (error) {
    console.error("BIN lookup route error:", error);
    return res.status(500).json({ error: "Failed to perform BIN lookup" });
  }
});

// 2. Create Card: POST /cards
router.post("/", async (req, res) => {
  const { name, bank, cardNumber, expiry, cvv, bankName, network, cardType, notes } = req.body;

  if (!name || !bank || !cardNumber || !expiry || !cvv) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Encrypt sensitive details before database write
    const encryptedCardNumber = encrypt(cardNumber);
    const encryptedCvv = encrypt(cvv);

    let expiryDate = null;
    if (expiry && expiry.includes("/")) {
      const [month, year] = expiry.split("/");
      const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      // Set to the last day of the expiry month
      expiryDate = new Date(parseInt(fullYear), parseInt(month), 0);
    }

    const card = await prisma.card.create({
      data: {
        userId: req.user.id,
        name,
        bank,
        encryptedCardNumber,
        expiry,
        expiryDate,
        encryptedCvv,
        bankName: bankName || null,
        network: network || null,
        cardType: cardType || null,
        notes: notes || null,
        category: req.body.category || "Personal",
      },
    });

    await activityService.logActivity({
      userId: req.user.id,
      entityId: card.id,
      type: "CARD",
      action: "CREATED",
      metadata: { name: card.name, bank: card.bank }
    });

    // Return masked representation for client-side display safety
    return res.status(201).json({
      ...card,
      cardNumber: "**** **** **** " + cardNumber.slice(-4),
      cvv: "***",
      encryptedCardNumber: undefined,
      encryptedCvv: undefined,
    });
  } catch (error) {
    console.error("Error creating card:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 3. List Cards: GET /cards
router.get("/", async (req, res) => {
  try {
    const cards = await prisma.card.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Decrypt and return only masked credit card numbers to list views
    const maskedCards = cards.map((card) => {
      let cardNumberMasked = "xxxx";
      try {
        const decrypted = decrypt(card.encryptedCardNumber);
        cardNumberMasked = "**** **** **** " + decrypted.slice(-4);
      } catch (e) {
        console.error(`Failed to decrypt card number for card ${card.id}`);
      }

      return {
        ...card,
        cardNumber: cardNumberMasked,
        cvv: "***",
        encryptedCardNumber: undefined,
        encryptedCvv: undefined,
      };
    });

    return res.json(maskedCards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 4. Reveal Plaintext Credentials: GET /cards/:id/reveal
router.get("/:id/reveal", async (req, res) => {
  const { id } = req.params;

  // Enforce API validation check that client successfully solved biometrics or local PIN checks
  const isClientAuthenticated = req.headers["x-vault-authenticated"] === "true";
  if (!isClientAuthenticated) {
    return res.status(401).json({ error: "Unauthorized: Local biometric authentication verification required" });
  }

  try {
    const card = await prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Security check: Verify card belongs to the requesting user
    if (card.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }

    // Decrypt fields
    const decryptedCardNumber = decrypt(card.encryptedCardNumber);
    const decryptedCvv = decrypt(card.encryptedCvv);

    return res.json({
      cardNumber: decryptedCardNumber,
      cvv: decryptedCvv,
    });
  } catch (error) {
    console.error("Error revealing card details:", error);
    return res.status(500).json({ error: "Internal server error during decryption" });
  }
});

// Toggle Favorite: PATCH /cards/:id/favorite
router.patch("/:id/favorite", async (req, res) => {
  try {
    const card = await prisma.card.findUnique({ where: { id: req.params.id } });
    if (!card || card.userId !== req.user.id) {
      return res.status(404).json({ error: "Card not found" });
    }
    
    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data: { favorite: !card.favorite },
    });
    
    return res.json(updated);
  } catch (error) {
    console.error("Toggle card favorite error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 5. Get Specific Card details (Masked): GET /cards/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const card = await prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }

    let cardNumberMasked = "xxxx";
    try {
      const decrypted = decrypt(card.encryptedCardNumber);
      cardNumberMasked = "**** **** **** " + decrypted.slice(-4);
    } catch (e) {
      console.error(`Failed to decrypt card number for card ${card.id}`);
    }

    return res.json({
      ...card,
      cardNumber: cardNumberMasked,
      cvv: "***",
      encryptedCardNumber: undefined,
      encryptedCvv: undefined,
    });
  } catch (error) {
    console.error("Error fetching card details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 6. Delete Card: DELETE /cards/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const card = await prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }

    await prisma.card.delete({
      where: { id },
    });

    await activityService.logActivity({
      userId: req.user.id,
      entityId: id,
      type: "CARD",
      action: "DELETED",
      metadata: { name: card.name }
    });

    return res.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
