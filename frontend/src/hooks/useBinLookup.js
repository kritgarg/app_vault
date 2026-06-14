import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { cardService } from "../services/card.service";

/**
 * Custom React Query hook for performing debounced BIN lookups.
 * @param {string} binNumber - Card number text input.
 */
export function useBinLookup(binNumber) {
  const [debouncedBin, setDebouncedBin] = useState("");

  useEffect(() => {
    // Extract only digits
    const cleaned = (binNumber || "").replace(/\D/g, "");

    // A standard BIN is 6 to 8 digits
    if (cleaned.length < 6) {
      setDebouncedBin("");
      return;
    }

    // Debounce the API call by 400ms to avoid spamming requests while the user is actively typing
    const handler = setTimeout(() => {
      setDebouncedBin(cleaned.slice(0, 8));
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [binNumber]);

  return useQuery({
    queryKey: ["binLookup", debouncedBin],
    queryFn: () => cardService.lookupBIN(debouncedBin),
    enabled: debouncedBin.length >= 6,
    staleTime: 24 * 60 * 60 * 1000, // Cache results for 24 hours (BIN properties are static)
    retry: 1, // Avoid aggressive retries on network failures
  });
}
