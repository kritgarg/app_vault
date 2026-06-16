import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cardService } from "../services/card.service";

// Hook to fetch and cache all cards owned by the active user
export function useCards() {
  return useQuery({
    queryKey: ["cards"],
    queryFn: cardService.getCards,
  });
}

// Hook to fetch and cache detailed parameters of a single card
export function useCardDetails(id) {
  return useQuery({
    queryKey: ["card", id],
    queryFn: () => cardService.getCardById(id),
    enabled: !!id, // Only trigger request if a valid ID is provided
  });
}

// Hook to decrypt and reveal raw credentials (requires biometric verification)
export function useRevealCard() {
  return useMutation({
    mutationFn: (id) => cardService.revealCard(id),
  });
}

export function useToggleCardFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => cardService.toggleFavorite(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    },
  });
}
